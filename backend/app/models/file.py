"""
File model for managing uploaded and processed files.
"""
import uuid
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from app.models import db

class File(db.Model):
    __tablename__ = 'files'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_name = db.Column(db.String(255), nullable=False)
    stored_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    thumbnail_path = db.Column(db.String(500), nullable=True)

    def __init__(self, original_name, stored_path, file_size, mime_type, thumbnail_path=None):
        self.original_name = secure_filename(original_name)
        self.stored_path = stored_path
        self.file_size = file_size
        self.mime_type = mime_type
        self.thumbnail_path = thumbnail_path

    def to_dict(self):
        """Convert File object to dictionary."""
        return {
            'id': self.id,
            'original_name': self.original_name,
            'stored_path': self.stored_path,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'upload_date': self.upload_date.isoformat(),
            'thumbnail_path': self.thumbnail_path
        }

    def get_url(self, base_url=''):
        """Get public URL for the file."""
        return f"{base_url}/files/{self.id}"

    def get_thumbnail_url(self, base_url=''):
        """Get thumbnail URL if available."""
        if self.thumbnail_path:
            return f"{base_url}/thumbnails/{self.id}"
        return None

    def delete_files(self):
        """Delete the actual files from filesystem."""
        try:
            if os.path.exists(self.stored_path):
                os.remove(self.stored_path)
            if self.thumbnail_path and os.path.exists(self.thumbnail_path):
                os.remove(self.thumbnail_path)
        except Exception as e:
            print(f"Error deleting files: {e}")

    def __repr__(self):
        return f'<File {self.id}: {self.original_name}>'

# File type validation
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi'}

def allowed_file(filename, file_type='both'):
    """Check if file extension is allowed."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()

    if file_type == 'image':
        return ext in ALLOWED_IMAGE_EXTENSIONS
    elif file_type == 'video':
        return ext in ALLOWED_VIDEO_EXTENSIONS
    else:  # both
        return ext in ALLOWED_IMAGE_EXTENSIONS or ext in ALLOWED_VIDEO_EXTENSIONS