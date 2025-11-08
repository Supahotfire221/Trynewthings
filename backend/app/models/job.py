"""
Job model for tracking face swap processing jobs.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from app.models import db

class JobStatus(enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FileType(enum.Enum):
    IMAGE = "image"
    VIDEO = "video"

class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.Enum(FileType), nullable=False)
    status = db.Column(db.Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    progress = db.Column(db.Integer, default=0)  # 0-100
    source_face_coords = db.Column(JSON)
    target_face_coords = db.Column(JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    error_message = db.Column(db.Text, nullable=True)

    # Foreign keys
    source_file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=False)
    target_file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=False)
    result_file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=True)

    # Relationships
    source_file = db.relationship('File', foreign_keys=[source_file_id], backref='source_jobs')
    target_file = db.relationship('File', foreign_keys=[target_file_id], backref='target_jobs')
    result_file = db.relationship('File', foreign_keys=[result_file_id], backref='result_jobs')

    def to_dict(self):
        """Convert Job object to dictionary."""
        return {
            'id': self.id,
            'original_filename': self.original_filename,
            'file_type': self.file_type.value,
            'status': self.status.value,
            'progress': self.progress,
            'source_face_coords': self.source_face_coords,
            'target_face_coords': self.target_face_coords,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'error_message': self.error_message
        }

    def __repr__(self):
        return f'<Job {self.id}: {self.status.value}>'