"""
Status checking API endpoint.
"""
from flask import Blueprint, request, jsonify, send_file
from app.models import db, Job, File

status_bp = Blueprint('status', __name__)

@status_bp.route('/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get processing status for a specific job."""
    try:
        job = Job.query.get_or_404(job_id)

        response_data = {
            'job_id': job_id,
            'status': job.status.value,
            'progress': job.progress,
            'original_filename': job.original_filename,
            'file_type': job.file_type.value,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat()
        }

        # Add error message if job failed
        if job.error_message:
            response_data['error_message'] = job.error_message

        # Add result file info if completed
        if job.status.value == 'completed' and job.result_file_id:
            result_file = File.query.get(job.result_file_id)
            if result_file:
                response_data['result_file'] = {
                    'file_id': result_file.id,
                    'original_name': result_file.original_name,
                    'file_size': result_file.file_size,
                    'mime_type': result_file.mime_type,
                    'download_url': f"/api/download/{result_file.id}"
                }

        # Add source and target file info
        if job.source_file:
            response_data['source_file'] = {
                'file_id': job.source_file.id,
                'original_name': job.source_file.original_name,
                'file_type': 'image' if not job.source_file.mime_type.startswith('video/') else 'video'
            }

        if job.target_file:
            response_data['target_file'] = {
                'file_id': job.target_file.id,
                'original_name': job.target_file.original_name,
                'file_type': 'image' if not job.target_file.mime_type.startswith('video/') else 'video'
            }

        return jsonify({
            'success': True,
            'data': response_data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get job status: {str(e)}'
        }), 500

@status_bp.route('/status', methods=['GET'])
def get_all_jobs_status():
    """Get status of all jobs (for admin purposes)."""
    try:
        # Get query parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        status_filter = request.args.get('status')

        # Build query
        query = Job.query

        if status_filter:
            query = query.filter(Job.status == status_filter)

        # Order by creation date (newest first)
        query = query.order_by(Job.created_at.desc())

        # Apply pagination
        jobs = query.offset(offset).limit(limit).all()
        total_count = query.count()

        # Convert to dict format
        jobs_data = []
        for job in jobs:
            job_data = job.to_dict()

            # Add file info
            if job.source_file:
                job_data['source_filename'] = job.source_file.original_name
            if job.target_file:
                job_data['target_filename'] = job.target_file.original_name
            if job.result_file:
                job_data['result_filename'] = job.result_file.original_name

            jobs_data.append(job_data)

        return jsonify({
            'success': True,
            'data': {
                'jobs': jobs_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get jobs status: {str(e)}'
        }), 500

@status_bp.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    """Download processed files."""
    try:
        file_record = File.query.get_or_404(file_id)

        # Check if file exists
        import os
        if not os.path.exists(file_record.stored_path):
            return jsonify({
                'success': False,
                'error': 'File not found on disk'
            }), 404

        # Determine MIME type for response
        mime_type = file_record.mime_type
        if not mime_type:
            # Default MIME types based on file extension
            if file_record.original_name.lower().endswith(('.jpg', '.jpeg')):
                mime_type = 'image/jpeg'
            elif file_record.original_name.lower().endswith('.png'):
                mime_type = 'image/png'
            elif file_record.original_name.lower().endswith('.mp4'):
                mime_type = 'video/mp4'
            else:
                mime_type = 'application/octet-stream'

        # Send file
        return send_file(
            file_record.stored_path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=file_record.original_name
        )

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Download failed: {str(e)}'
        }), 500

@status_bp.route('/stats', methods=['GET'])
def get_processing_stats():
    """Get processing statistics."""
    try:
        from app.models import JobStatus

        # Count jobs by status
        stats = {}
        for status in JobStatus:
            count = Job.query.filter(Job.status == status).count()
            stats[status.value] = count

        # Get recent activity
        recent_jobs = Job.query.order_by(Job.created_at.desc()).limit(10).all()
        recent_activity = []
        for job in recent_jobs:
            recent_activity.append({
                'job_id': job.id,
                'status': job.status.value,
                'original_filename': job.original_filename,
                'file_type': job.file_type.value,
                'created_at': job.created_at.isoformat()
            })

        return jsonify({
            'success': True,
            'data': {
                'job_counts': stats,
                'recent_activity': recent_activity,
                'total_jobs': sum(stats.values())
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get stats: {str(e)}'
        }), 500

@status_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        # Check database connection
        db.session.execute('SELECT 1')

        # Check if essential directories exist
        import os
        from flask import current_app

        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        processed_folder = current_app.config.get('PROCESSED_FOLDER', 'processed')

        upload_exists = os.path.exists(upload_folder)
        processed_exists = os.path.exists(processed_folder)

        return jsonify({
            'success': True,
            'data': {
                'status': 'healthy',
                'database': 'connected',
                'upload_folder': 'exists' if upload_exists else 'missing',
                'processed_folder': 'exists' if processed_exists else 'missing'
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Health check failed: {str(e)}'
        }), 500