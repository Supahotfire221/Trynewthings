"""
Background job processor for face swap tasks using Celery.
"""
import os
import uuid
from datetime import datetime
from celery import Celery
from flask import current_app

# Initialize Celery
celery = Celery('faceswap')

def make_celery(app):
    """Create Celery instance with Flask app context."""
    celery.conf.update(
        broker_url='redis://localhost:6379/0',
        result_backend='redis://localhost:6379/0',
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )

    class ContextTask(celery.Task):
        """Make celery tasks work with Flask app context."""
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

# This will be initialized when the Flask app is created
def init_celery(app):
    """Initialize Celery with Flask app."""
    return make_celery(app)

@celery.task(bind=True)
def process_face_swap_job(self, job_id, source_file_id, target_file_id,
                         source_face_coords, target_face_coords, model, file_type):
    """
    Process face swap job asynchronously.

    Args:
        job_id: ID of the job to process
        source_file_id: ID of source file
        target_file_id: ID of target file
        source_face_coords: Source face coordinates
        target_face_coords: Target face coordinates
        model: Face swap model to use
        file_type: Type of file ('image' or 'video')
    """
    from app import create_app
    from app.models import db, Job, File, JobStatus

    # Create Flask app context for this task
    app = create_app()
    with app.app_context():
        try:
            # Get job and files
            job = Job.query.get(job_id)
            if not job:
                raise Exception(f"Job {job_id} not found")

            source_file = File.query.get(source_file_id)
            target_file = File.query.get(target_file_id)

            if not source_file or not target_file:
                raise Exception("Source or target file not found")

            # Update job status to processing
            job.status = JobStatus.PROCESSING
            job.progress = 10
            db.session.commit()

            # Send WebSocket update (if available)
            _send_job_update(job_id, 'processing', 10)

            # Generate output path
            processed_folder = app.config.get('PROCESSED_FOLDER', 'processed')
            os.makedirs(processed_folder, exist_ok=True)

            result_id = str(uuid.uuid4())
            file_extension = 'mp4' if file_type == 'video' else 'jpg'
            output_path = os.path.join(processed_folder, f"{result_id}.{file_extension}")

            # Import here to avoid circular imports
            from app.ai.facefusion_handler import face_swapper

            # Update progress
            job.progress = 30
            db.session.commit()
            _send_job_update(job_id, 'processing', 30)

            # Perform face swap
            job.progress = 50
            db.session.commit()
            _send_job_update(job_id, 'processing', 50)

            if file_type == 'image':
                success = face_swapper.swap_faces_in_image(
                    source_file.stored_path, target_file.stored_path,
                    source_face_coords, target_face_coords, output_path, model
                )
            else:  # video
                # Update progress for video processing
                job.progress = 40
                db.session.commit()
                _send_job_update(job_id, 'processing', 40)

                success = face_swapper.swap_faces_in_video(
                    source_file.stored_path, target_file.stored_path,
                    source_face_coords, target_face_coords, output_path, model
                )

            job.progress = 80
            db.session.commit()
            _send_job_update(job_id, 'processing', 80)

            if success and os.path.exists(output_path):
                # Create result file record
                result_file = File(
                    original_name=f"swap_{target_file.original_name}",
                    stored_path=output_path,
                    file_size=os.path.getsize(output_path),
                    mime_type=f"{'video' if file_type == 'video' else 'image'}/{file_extension}"
                )

                db.session.add(result_file)
                db.session.flush()  # Get the ID without committing

                # Update job with result
                job.result_file_id = result_file.id
                job.status = JobStatus.COMPLETED
                job.progress = 100
                job.updated_at = datetime.utcnow()
                db.session.commit()

                _send_job_update(job_id, 'completed', 100)

                return {
                    'success': True,
                    'job_id': job_id,
                    'result_file_id': result_file.id,
                    'file_type': file_type
                }
            else:
                raise Exception("Face swap processing failed - no output generated")

        except Exception as e:
            # Update job with error
            try:
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.progress = 0
                job.updated_at = datetime.utcnow()
                db.session.commit()

                _send_job_update(job_id, 'failed', 0, str(e))

            except Exception as db_error:
                print(f"Error updating job status: {db_error}")

            # Re-raise exception for Celery error handling
            raise

def _send_job_update(job_id, status, progress, error_message=None):
    """Send job update via WebSocket."""
    try:
        from app import socketio
        import json

        data = {
            'job_id': job_id,
            'status': status,
            'progress': progress,
            'timestamp': datetime.utcnow().isoformat()
        }

        if error_message:
            data['error_message'] = error_message

        socketio.emit('job_update', data, room=f"job_{job_id}")

    except Exception as e:
        print(f"Error sending WebSocket update: {e}")

# Cleanup task
@celery.task
def cleanup_old_files():
    """Clean up old files and completed jobs."""
    from app import create_app
    from app.models import db, Job, JobStatus
    from app.utils.file_utils import cleanup_old_files
    from datetime import datetime, timedelta

    app = create_app()
    with app.app_context():
        try:
            # Delete jobs older than 24 hours
            cutoff_time = datetime.utcnow() - timedelta(hours=24)

            old_jobs = Job.query.filter(
                Job.created_at < cutoff_time,
                Job.status.in_([JobStatus.COMPLETED, JobStatus.FAILED])
            ).all()

            for job in old_jobs:
                try:
                    # Delete associated files
                    if job.result_file:
                        job.result_file.delete_files()
                        db.session.delete(job.result_file)

                    db.session.delete(job)
                except Exception as e:
                    print(f"Error cleaning up job {job.id}: {e}")

            db.session.commit()

            # Clean up temporary files
            upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
            processed_folder = app.config.get('PROCESSED_FOLDER', 'processed')

            cleanup_old_files(upload_folder, 24)
            cleanup_old_files(processed_folder, 24)

            print(f"Cleanup completed: removed {len(old_jobs)} old jobs")

        except Exception as e:
            print(f"Error during cleanup: {e}")

# Schedule periodic cleanup
try:
    from celery.schedules import crontab
    celery.conf.beat_schedule = {
        'cleanup-old-files': {
            'task': 'app.services.job_processor.cleanup_old_files',
            'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours
        },
    }
except Exception:
    # Celery Beat configuration might not be available
    pass