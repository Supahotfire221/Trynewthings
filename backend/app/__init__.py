"""
Flask application factory for Face Swap AI.
"""
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from app.models import db, init_db

socketio = SocketIO()

def create_app(config_name='development'):
    """Create and configure Flask application."""
    app = Flask(__name__)

    # Configuration
    if config_name == 'development':
        app.config['DEBUG'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///faceswap.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['UPLOAD_FOLDER'] = 'uploads'
        app.config['PROCESSED_FOLDER'] = 'processed'
        app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
    else:
        # Production configuration would use environment variables
        app.config['DEBUG'] = False
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')
        app.config['PROCESSED_FOLDER'] = os.environ.get('PROCESSED_FOLDER', 'processed')
        app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 500 * 1024 * 1024))

    # Initialize extensions
    db.init_app(app)
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')

    # Register blueprints
    from app.routes.upload import upload_bp
    from app.routes.face_detection import face_detection_bp
    from app.routes.face_swap import face_swap_bp
    from app.routes.status import status_bp

    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(face_detection_bp, url_prefix='/api')
    app.register_blueprint(face_swap_bp, url_prefix='/api')
    app.register_blueprint(status_bp, url_prefix='/api')

    # Initialize database
    init_db(app)

    return app