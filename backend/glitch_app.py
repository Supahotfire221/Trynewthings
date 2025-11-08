#!/usr/bin/env python3
"""
Glitch-compatible Flask app for Face Swap AI demo.
"""
from flask import Flask, request, jsonify, render_template_string
import os
import uuid
import json
from datetime import datetime

app = Flask(__name__)

# Basic configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# Simple HTML template for demo
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Face Swap AI - Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
        .upload-area { border: 2px dashed white; padding: 40px; margin: 20px 0; border-radius: 10px; cursor: pointer; }
        .upload-area:hover { background: rgba(255,255,255,0.1); }
        button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 10px; }
        button:hover { background: #45a049; }
        .result { background: rgba(0,255,0,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .error { background: rgba(255,0,0,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 Face Swap AI - Demo</h1>
        <p>Upload images to see how face swapping works!</p>

        <div class="upload-area" onclick="document.getElementById('file1').click()">
            <h3>📤 Upload Source Image</h3>
            <p>Click to select the face you want to use</p>
            <input type="file" id="file1" style="display: none" accept="image/*">
        </div>

        <div class="upload-area" onclick="document.getElementById('file2').click()">
            <h3>📥 Upload Target Image</h3>
            <p>Click to select where to apply the face</p>
            <input type="file" id="file2" style="display: none" accept="image/*">
        </div>

        <button onclick="startFaceSwap()" id="swapBtn" disabled>🚀 Start Face Swap</button>

        <div id="result"></div>

        <div style="margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <h3>ℹ️ About This Demo</h3>
            <p>This is a demonstration of the Face Swap AI interface. In the full version:</p>
            <ul style="text-align: left; display: inline-block;">
                <li>✅ Real AI face detection using InsightFace</li>
                <li>✅ Advanced face swapping with FaceFusion</li>
                <li>✅ Support for images AND videos</li>
                <li>✅ High-quality processing with no watermarks</li>
            </ul>
        </div>
    </div>

    <script>
        let sourceFile = null;
        let targetFile = null;

        document.getElementById('file1').addEventListener('change', function(e) {
            sourceFile = e.target.files[0];
            updateButtonText();
        });

        document.getElementById('file2').addEventListener('change', function(e) {
            targetFile = e.target.files[0];
            updateButtonText();
        });

        function updateButtonText() {
            const btn = document.getElementById('swapBtn');
            if (sourceFile && targetFile) {
                btn.disabled = false;
                btn.textContent = '🚀 Start Face Swap';
            } else {
                btn.disabled = true;
                btn.textContent = 'Please upload both images';
            }
        }

        async function startFaceSwap() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="result">🔄 Processing face swap...</div>';

            // Simulate processing
            setTimeout(() => {
                resultDiv.innerHTML = `
                    <div class="result">
                        <h3>✅ Face Swap Completed!</h3>
                        <p><strong>Source:</strong> ${sourceFile.name}</p>
                        <p><strong>Target:</strong> ${targetFile.name}</p>
                        <p><strong>Confidence:</strong> 98.5%</p>
                        <p><strong>Processing Time:</strong> 2.3 seconds</p>
                        <p><em>🎉 This is a demo. The actual AI processing would swap the faces!</em></p>
                        <button onclick="location.reload()">Try Again</button>
                    </div>
                `;
            }, 2000);
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the demo app."""
    return HTML_TEMPLATE

@app.route('/api/health')
def health():
    """Health check."""
    return jsonify({
        'status': 'healthy',
        'service': 'Face Swap AI Demo',
        'version': '1.0.0'
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload."""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        return jsonify({
            'success': True,
            'data': {
                'file_id': str(uuid.uuid4()),
                'original_name': file.filename,
                'file_size': len(file.read()),
                'message': 'File uploaded successfully!'
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/detect-faces', methods=['POST'])
def detect_faces():
    """Mock face detection."""
    return jsonify({
        'success': True,
        'data': {
            'total_faces': 1,
            'faces': [{
                'face_id': 0,
                'bbox': {'x1': 100, 'y1': 100, 'x2': 200, 'y2': 200},
                'confidence': 0.95,
                'quality_label': 'excellent'
            }]
        }
    })

@app.route('/api/swap-faces', methods=['POST'])
def swap_faces():
    """Mock face swap."""
    return jsonify({
        'success': True,
        'data': {
            'job_id': str(uuid.uuid4()),
            'status': 'completed',
            'estimated_time': '2-5 seconds'
        }
    })

@app.route('/api/status/<job_id>')
def get_status(job_id):
    """Mock job status."""
    return jsonify({
        'success': True,
        'data': {
            'job_id': job_id,
            'status': 'completed',
            'progress': 100
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)