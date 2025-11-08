"""
Face detection API endpoint.
"""
import cv2
import numpy as np
from flask import Blueprint, request, jsonify
from app.models import db, File
from app.ai.insightface_handler import face_detector

face_detection_bp = Blueprint('face_detection', __name__)

@face_detection_bp.route('/detect-faces', methods=['POST'])
def detect_faces():
    """Detect faces in uploaded images or video frames."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        file_id = data.get('file_id')
        confidence_threshold = data.get('confidence_threshold', 0.5)
        min_quality = data.get('min_quality', 0.4)

        if not file_id:
            return jsonify({
                'success': False,
                'error': 'file_id is required'
            }), 400

        # Get file from database
        db_file = File.query.get_or_404(file_id)

        # Determine if it's an image or video
        is_video = db_file.mime_type.startswith('video/')

        if is_video:
            # For videos, extract key frames and detect faces
            faces = _detect_faces_in_video(db_file.stored_path, confidence_threshold, min_quality)
        else:
            # For images, detect faces directly
            faces = _detect_faces_in_image(db_file.stored_path, confidence_threshold, min_quality)

        # Filter by minimum quality if specified
        if min_quality > 0:
            faces = face_detector.filter_faces_by_quality(faces, min_quality)

        # Get best face if any
        best_face = face_detector.get_best_face(faces) if faces else None

        response_data = {
            'file_id': file_id,
            'file_type': 'video' if is_video else 'image',
            'total_faces': len(faces),
            'faces': faces,
            'best_face': best_face,
            'confidence_threshold': confidence_threshold,
            'min_quality': min_quality
        }

        return jsonify({
            'success': True,
            'data': response_data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Face detection failed: {str(e)}'
        }), 500

@face_detection_bp.route('/detect-faces-frame', methods=['POST'])
def detect_faces_frame():
    """Detect faces in a specific video frame or uploaded image data."""
    try:
        # Handle base64 image data
        if 'image_data' in request.json:
            return _detect_faces_in_base64_image()

        # Handle video frame extraction
        if 'file_id' in request.json and 'frame_number' in request.json:
            return _detect_faces_in_video_frame()

        return jsonify({
            'success': False,
            'error': 'Either image_data or (file_id and frame_number) must be provided'
        }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Frame face detection failed: {str(e)}'
        }), 500

def _detect_faces_in_image(image_path, confidence_threshold, min_quality):
    """Detect faces in a single image."""
    faces = face_detector.detect_faces(image_path, confidence_threshold)
    return face_detector.filter_faces_by_quality(faces, min_quality)

def _detect_faces_in_video(video_path, confidence_threshold, min_quality, max_frames=10):
    """Detect faces in video by sampling key frames."""
    faces = []

    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        # Sample frames evenly throughout the video
        frame_interval = max(1, total_frames // max_frames)

        frame_count = 0
        sampled_faces = {}

        while cap.isOpened() and frame_count < total_frames and len(sampled_faces) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            # Sample frames at intervals
            if frame_count % frame_interval == 0:
                timestamp = frame_count / fps if fps > 0 else frame_count

                # Detect faces in this frame
                frame_faces = face_detector.detect_faces_in_video_frame(frame, confidence_threshold)

                # Filter by quality
                quality_faces = face_detector.filter_faces_by_quality(frame_faces, min_quality)

                if quality_faces:
                    # Add frame information to each face
                    for face in quality_faces:
                        face['frame_number'] = frame_count
                        face['timestamp'] = round(timestamp, 2)

                    sampled_faces[frame_count] = quality_faces

            frame_count += 1

        cap.release()

        # Combine all detected faces
        for frame_faces in sampled_faces.values():
            faces.extend(frame_faces)

        # Sort by quality score
        faces.sort(key=lambda x: x['quality_score'], reverse=True)

        return faces

    except Exception as e:
        print(f"Error detecting faces in video: {e}")
        return []

def _detect_faces_in_base64_image():
    """Detect faces in base64 encoded image data."""
    import base64
    from io import BytesIO
    from PIL import Image

    try:
        data = request.get_json()
        image_data = data.get('image_data')
        confidence_threshold = data.get('confidence_threshold', 0.5)

        if not image_data:
            raise ValueError('No image_data provided')

        # Remove data URL prefix if present
        if image_data.startswith('data:image/'):
            image_data = image_data.split(',')[1]

        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))

        # Convert PIL Image to OpenCV format
        image_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Detect faces
        faces = face_detector.detect_faces_in_video_frame(image_array, confidence_threshold)

        return jsonify({
            'success': True,
            'data': {
                'total_faces': len(faces),
                'faces': faces,
                'best_face': face_detector.get_best_face(faces) if faces else None
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Base64 image processing failed: {str(e)}'
        }), 400

def _detect_faces_in_video_frame():
    """Detect faces in a specific frame of a video."""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        frame_number = int(data.get('frame_number', 0))
        confidence_threshold = data.get('confidence_threshold', 0.5)

        # Get file from database
        db_file = File.query.get_or_404(file_id)

        if not db_file.mime_type.startswith('video/'):
            raise ValueError('File is not a video')

        # Extract specific frame
        cap = cv2.VideoCapture(db_file.stored_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise ValueError(f'Could not extract frame {frame_number}')

        # Detect faces in frame
        faces = face_detector.detect_faces_in_video_frame(frame, confidence_threshold)

        return jsonify({
            'success': True,
            'data': {
                'file_id': file_id,
                'frame_number': frame_number,
                'total_faces': len(faces),
                'faces': faces,
                'best_face': face_detector.get_best_face(faces) if faces else None
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Frame extraction failed: {str(e)}'
        }), 400