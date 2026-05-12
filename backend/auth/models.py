from database import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False, default='operator')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


class Accident(db.Model):
    __tablename__ = 'accidents'

    id = db.Column(db.Integer, primary_key=True)
    camera_id = db.Column(db.String(50), nullable=False)
    accident_type = db.Column(db.String(50), nullable=False)  # COLLISION, ROLLOVER, PERSON_HIT
    vehicles_involved = db.Column(db.Integer, default=0)
    persons_involved = db.Column(db.Integer, default=0)
    confidence = db.Column(db.Float, nullable=False)
    screenshot_path = db.Column(db.String(255), nullable=True)
    road_name = db.Column(db.String(100), nullable=True)
    location_lat = db.Column(db.Float, nullable=True)
    location_lng = db.Column(db.Float, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to alerts
    alerts = db.relationship('Alert', backref='accident', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'camera_id': self.camera_id,
            'accident_type': self.accident_type,
            'vehicles_involved': self.vehicles_involved,
            'persons_involved': self.persons_involved,
            'confidence': round(self.confidence, 2),
            'screenshot_path': self.screenshot_path,
            'road_name': self.road_name,
            'location_lat': self.location_lat,
            'location_lng': self.location_lng,
            'timestamp': self.timestamp.isoformat()
        }

    def __repr__(self):
        return f'<Accident {self.accident_type} on {self.road_name}>'


class Alert(db.Model):
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True)
    accident_id = db.Column(db.Integer, db.ForeignKey('accidents.id'), nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    email_sent = db.Column(db.Boolean, default=False)
    sms_sent = db.Column(db.Boolean, default=False)
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_by = db.Column(db.String(80), nullable=True)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'accident_id': self.accident_id,
            'severity': self.severity,
            'email_sent': self.email_sent,
            'sms_sent': self.sms_sent,
            'acknowledged': self.acknowledged,
            'acknowledged_by': self.acknowledged_by,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'created_at': self.created_at.isoformat(),
            'accident': self.accident.to_dict() if self.accident else None
        }

    def __repr__(self):
        return f'<Alert {self.severity} for Accident {self.accident_id}>'