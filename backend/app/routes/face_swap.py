"""
Face swap API endpoint with job queue management.
"""
import uuid
import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.models import db, Job, File, JobStatus, FileType
from app.ai.facefusion_handler import face_swapper
from app.ai.insightface_handler import face_detector
from app.services.job_processor import process_face_swap_job

face_swap_bp = Blueprint('face_swap', __name__)

@face_swap_bp.route('/swap-faces', methods=['POST'])
def swap_faces():
    """Initiate face swapping process."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate required fields
        required_fields = ['source_file_id', 'target_file_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400

        source_file_id = data['source_file_id']
        target_file_id = data['target_file_id']
        source_face_coords = data.get('source_face_coords')
        target_face_coords = data.get('target_face_coords')
        model = data.get('model', 'inswapper_128')

        # Validate files exist
        source_file = File.query.get_or_404(source_file_id)
        target_file = File.query.get_or_404(target_file_id)

        # Verify files still exist on disk
        if not os.path.exists(source_file.stored_path) or not os.path.exists(target_file.stored_path):
            return jsonify({
                'success': False,
                'error': 'One or more files not found on disk'
            }), 404

        # Determine file types (both should be same type)
        source_is_video = source_file.mime_type.startswith('video/')
        target_is_video = target_file.mime_type.startswith('video/')

        file_type = FileType.VIDEO if (source_is_video or target_is_video) else FileType.IMAGE

        # If face coordinates not provided, detect faces automatically
        if not source_face_coords:
            source_faces = face_detector.detect_faces(source_file.stored_path)
            if not source_faces:
                return jsonify({
                    'success': False,
                    'error': 'No faces detected in source file'
                }), 400
            # Use best quality face
            best_face = face_detector.get_best_face(source_faces)
            source_face_coords = best_face['bbox']

        if not target_face_coords:
            target_faces = face_detector.detect_faces(target_file.stored_path)
            if not target_faces:
                return jsonify({
                    'success': False,
                    'error': 'No faces detected in target file'
                }), 400
            # Use best quality face
            best_face = face_detector.get_best_face(target_faces)
            target_face_coords = best_face['bbox']

        # Create job record
        job = Job(
            original_filename=f"{source_file.original_name}_to_{target_file.original_name}",
            file_type=file_type,
            status=JobStatus.QUEUED,
            source_face_coords=source_face_coords,
            target_face_coords=target_face_coords,
            source_file_id=source_file_id,
            target_file_id=target_file_id
        )

        db.session.add(job)
        db.session.commit()

        # Start background processing
        try:
            process_face_swap_job.delay(job.id, source_file_id, target_file_id,
                                       source_face_coords, target_face_coords,
                                       model, file_type.value)
        except Exception as e:
            # Update job status to failed if queue processing fails
            job.status = JobStatus.FAILED
            job.error_message = f"Failed to queue job: {str(e)}"
            job.updated_at = datetime.utcnow()
            db.session.commit()

            return jsonify({
                'success': False,
                'error': 'Failed to start processing. Please try again.'
            }), 500

        return jsonify({
            'success': True,
            'data': {
                'job_id': job.id,
                'status': job.status.value,
                'file_type': file_type.value,
                'estimated_time': self._estimate_processing_time(file_type, source_file, target_file)
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to initiate face swap: {str(e)}'
        }), 500

@face_swap_bp.route('/swap-faces-sync', methods=['POST'])
def swap_faces_sync():
    """Synchronous face swapping for testing and development."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Extract and validate parameters (same as async version)
        source_file_id = data['source_file_id']
        target_file_id = data['target_file_id']
        source_face_coords = data.get('source_face_coords')
        target_face_coords = data.get('target_face_coords')
        model = data.get('model', 'inswapper_128')

        source_file = File.query.get_or_404(source_file_id)
        target_file = File.query.get_or_404(target_file_id)

        source_is_video = source_file.mime_type.startswith('video/')
        target_is_video = target_file.mime_type.startswith('video/')
        file_type = 'video' if (source_is_video or target_is_video) else 'image'

        # Auto-detect faces if coordinates not provided
        if not source_face_coords:
            source_faces = face_detector.detect_faces(source_file.stored_path)
            if not source_faces:
                return jsonify({
                    'success': False,
                    'error': 'No faces detected in source file'
                }), 400
            best_face = face_detector.get_best_face(source_faces)
            source_face_coords = best_face['bbox']

        if not target_face_coords:
            target_faces = face_detector.detect_faces(target_file.stored_path)
            if not target_faces:
                return jsonify({
                    'success': False,
                    'error': 'No faces detected in target file'
                }), 400
            best_face = face_detector.get_best_face(target_faces)
            target_face_coords = best_face['bbox']

        # Perform synchronous face swap
        result_file_id = _perform_sync_swap(source_file, target_file,
                                           source_face_coords, target_face_coords,
                                           model, file_type)

        if result_file_id:
            return jsonify({
                'success': True,
                'data': {
                    'job_id': None,  # No job for synchronous processing
                    'result_file_id': result_file_id,
                    'file_type': file_type
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Face swap processing failed'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Synchronous face swap failed: {str(e)}'
        }), 500

@face_swap_bp.route('/cancel-job/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """Cancel a processing job."""
    try:
        job = Job.query.get_or_404(job_id)

        if job.status == JobStatus.COMPLETED:
            return jsonify({
                'success': False,
                'error': 'Cannot cancel completed job'
            }), 400

        if job.status == JobStatus.FAILED:
            return jsonify({
                'success': False,
                'error': 'Job has already failed'
            }), 400

        # Update job status to cancelled
        job.status = JobStatus.FAILED
        job.error_message = 'Job cancelled by user'
        job.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'job_id': job_id,
                'status': job.status.value
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to cancel job: {str(e)}'
        }), 500

def _perform_sync_swap(source_file: File, target_file: File,
                      source_face_coords: Dict, target_face_coords: Dict,
                      model: str, file_type: str) -> str:
    """Perform synchronous face swap and return result file ID."""
    try:
        # Generate output path
        processed_folder = current_app.config.get('PROCESSED_FOLDER', 'processed')
        os.makedirs(processed_folder, exist_ok=True)

        result_id = str(uuid.uuid4())
        file_extension = 'mp4' if file_type == 'video' else 'jpg'
        output_path = os.path.join(processed_folder, f"{result_id}.{file_extension}")

        # Perform face swap
        if file_type == 'image':
            success = face_swapper.swap_faces_in_image(
                source_file.stored_path, target_file.stored_path,
                source_face_coords, target_face_coords, output_path, model
            )
        else:  # video
            success = face_swapper.swap_faces_in_video(
                source_file.stored_path, target_file.stored_path,
                source_face_coords, target_face_coords, output_path, model
            )

        if success and os.path.exists(output_path):
            # Create result file record
            result_file = File(
                original_name=f"swap_{target_file.original_name}",
                stored_path=output_path,
                file_size=os.path.getsize(output_path),
                mime_type=f"{'video' if file_type == 'video' else 'image'}/{file_extension}"
            )

            db.session.add(result_file)
            db.session.commit()

            return result_file.id

        return None

    except Exception as e:
        print(f"Error in synchronous face swap: {e}")
        return None

def _estimate_processing_time(file_type: FileType, source_file: File, target_file: File) -> str:
    """Estimate processing time based on file types and sizes."""
    try:
        if file_type == FileType.IMAGE:
            # Images typically take 10-30 seconds
            return "10-30 seconds"
        else:
            # Videos take longer based on size
            # Rough estimate: 1 minute per 50MB
            total_size = source_file.file_size + target_file.file_size
            estimated_minutes = max(1, total_size / (50 * 1024 * 1024))
            estimated_minutes = min(10, estimated_minutes)  # Cap at 10 minutes

            return f"{int(estimated_minutes)}-{int(estimated_minutes * 1.5)} minutes"

    except Exception:
        return "Processing time varies"