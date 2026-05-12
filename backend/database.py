from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize database
db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        # Import all models here to ensure tables are created
        from auth.models import User, Accident, Alert

        # Create all tables first
        db.create_all()
        print("✅ Database tables created!")
        print("   → users table")
        print("   → accidents table")
        print("   → alerts table")

        # Then create default admin
        create_default_admin()
        print("✅ Database initialized successfully!")


def create_default_admin():
    from auth.models import User
    import bcrypt

    # Check if admin already exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        hashed = bcrypt.hashpw(
            'admin123'.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        admin = User(
            username='admin',
            password=hashed,
            role='admin',
            email='admin@accidentdetection.com',
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Default admin created!")
        print("   Username: admin")
        print("   Password: admin123")
    else:
        print("✅ Admin already exists!")
