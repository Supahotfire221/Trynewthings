#!/usr/bin/env python3
"""
Simplified Flask app for deployment to free hosting.
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Basic configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    """Basic health check."""
    return jsonify({
        'status': 'healthy',
        'message': 'Face Swap AI is running!',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Face Swap AI',
        'version': '1.0.0'
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Simple file upload endpoint."""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Save file
        file.save(file_path)

        return jsonify({
            'success': True,
            'data': {
                'file_id': file_id,
                'original_name': file.filename,
                'file_size': os.path.getsize(file_path),
                'stored_path': file_path
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/detect-faces', methods=['POST'])
def detect_faces():
    """Mock face detection (returns sample data)."""
    try:
        data = request.get_json()
        file_id = data.get('file_id')

        # Return mock detected faces for demo
        mock_faces = [
            {
                'face_id': 0,
                'bbox': {
                    'x1': 100, 'y1': 100, 'x2': 200, 'y2': 200,
                    'width': 100, 'height': 100
                },
                'confidence': 0.95,
                'quality_score': 0.88,
                'quality_label': 'excellent'
            }
        ]

        return jsonify({
            'success': True,
            'data': {
                'file_id': file_id,
                'file_type': 'image',
                'total_faces': 1,
                'faces': mock_faces,
                'best_face': mock_faces[0]
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/swap-faces', methods=['POST'])
def swap_faces():
    """Mock face swap (returns sample job)."""
    try:
        data = request.get_json()
        job_id = str(uuid.uuid4())

        return jsonify({
            'success': True,
            'data': {
                'job_id': job_id,
                'status': 'queued',
                'file_type': 'image',
                'estimated_time': '2-5 minutes'
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/status/<job_id>')
def get_job_status(job_id):
    """Mock job status."""
    return jsonify({
        'success': True,
        'data': {
            'job_id': job_id,
            'status': 'completed',
            'progress': 100,
            'original_filename': 'face_swap_result.jpg',
            'file_type': 'image',
            'result_file': {
                'file_id': job_id,
                'original_name': 'face_swap_result.jpg',
                'download_url': f'/api/download/{job_id}'
            }
        }
    })

@app.route('/api/download/<file_id>')
def download_file(file_id):
    """Mock file download."""
    # For demo, return a simple text response
    return jsonify({
        'message': 'Face swap completed! (Demo version)',
        'file_id': file_id
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)