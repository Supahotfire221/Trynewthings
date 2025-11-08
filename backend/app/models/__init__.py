"""
Database models initialization.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app."""
    db.init_app(app)

# Import all models to ensure they are registered
from .job import Job
from .file import File

def create_tables(app):
    """Create all database tables."""
    with app.app_context():
        db.create_all()