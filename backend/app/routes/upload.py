"""
File upload API endpoint.
"""
import os
import uuid
from PIL import Image
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.models import db, File, allowed_file
from app.utils.file_utils import generate_thumbnail

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and validation."""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'File type not supported. Allowed formats: jpg, jpeg, png, webp, mp4, mov, avi'
            }), 400

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        stored_filename = f"{file_id}.{file_extension}"

        # Determine file type
        file_type = 'image' if file_extension in {'jpg', 'jpeg', 'png', 'webp'} else 'video'

        # Create upload directory if it doesn't exist
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        # Save file
        file_path = os.path.join(upload_folder, stored_filename)
        file.save(file_path)

        # Get file size
        file_size = os.path.getsize(file_path)

        # Generate thumbnail for videos and images
        thumbnail_path = None
        try:
            thumbnail_path = generate_thumbnail(file_path, file_id, file_type, upload_folder)
        except Exception as e:
            print(f"Thumbnail generation failed: {e}")

        # Create database record
        db_file = File(
            original_name=filename,
            stored_path=file_path,
            file_size=file_size,
            mime_type=file.content_type or f"application/{file_type}",
            thumbnail_path=thumbnail_path
        )

        db.session.add(db_file)
        db.session.commit()

        # Return success response
        return jsonify({
            'success': True,
            'data': {
                'file_id': db_file.id,
                'original_name': db_file.original_name,
                'file_type': file_type,
                'file_size': db_file.file_size,
                'mime_type': db_file.mime_type,
                'thumbnail_path': thumbnail_path
            }
        })

    except Exception as e:
        db.session.rollback()
        # Clean up uploaded file if database operation failed
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        if 'thumbnail_path' in locals() and thumbnail_path and os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)

        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@upload_bp.route('/files/<file_id>', methods=['GET'])
def get_file(file_id):
    """Serve uploaded files."""
    try:
        db_file = File.query.get_or_404(file_id)

        if not os.path.exists(db_file.stored_path):
            return jsonify({
                'success': False,
                'error': 'File not found'
            }), 404

        return jsonify({
            'success': True,
            'data': db_file.to_dict()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve file: {str(e)}'
        }), 500