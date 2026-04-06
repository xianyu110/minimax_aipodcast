"""Database models for users and podcast jobs."""

from datetime import datetime, timezone

from extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=True)
    plan = db.Column(db.String(32), nullable=False, default='free')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    last_login_at = db.Column(db.DateTime, nullable=True)

    jobs = db.relationship('PodcastJob', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'display_name': self.display_name,
            'plan': self.plan,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
        }


class PodcastJob(db.Model):
    __tablename__ = 'podcast_jobs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    status = db.Column(db.String(32), nullable=False, default='queued', index=True)
    title = db.Column(db.String(255), nullable=True)
    source_type = db.Column(db.String(32), nullable=True)
    source_summary = db.Column(db.Text, nullable=True)
    speaker1_voice = db.Column(db.String(128), nullable=True)
    speaker2_voice = db.Column(db.String(128), nullable=True)
    audio_path = db.Column(db.String(512), nullable=True)
    script_path = db.Column(db.String(512), nullable=True)
    cover_path = db.Column(db.String(512), nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    trace_ids_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'status': self.status,
            'title': self.title,
            'source_type': self.source_type,
            'source_summary': self.source_summary,
            'speaker1_voice': self.speaker1_voice,
            'speaker2_voice': self.speaker2_voice,
            'audio_path': self.audio_path,
            'script_path': self.script_path,
            'cover_path': self.cover_path,
            'duration_seconds': self.duration_seconds,
            'error_message': self.error_message,
            'trace_ids_json': self.trace_ids_json,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
