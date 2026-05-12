from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_socketio import SocketIO

from config import config
from database import init_db

# Initialize extensions
mail = Mail()
socketio = SocketIO()
jwt = JWTManager()


def create_app(config_name='default'):
    app = Flask(__name__)

    # Load config
    app.config.from_object(config[config_name])

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)
    mail.init_app(app)
    socketio.init_app(
        app,
        cors_allowed_origins="*",
        async_mode='eventlet'
    )

    # Initialize database
    init_db(app)

    # ─── Initialize Services ──────────────────────────────
    from alerts.email_service import get_email_service
    from alerts.sms_service import get_sms_service
    from websocket.socket_manager import get_socket_manager
    from alerts.alert_engine import get_alert_engine

    email_svc = get_email_service()
    sms_svc = get_sms_service()
    socket_mgr = get_socket_manager()
    socket_mgr.initialize(socketio)

    alert_engine = get_alert_engine()
    alert_engine.initialize(email_svc, sms_svc, socket_mgr)

    # ─── Register Blueprints ──────────────────────────────
    from auth.routes import auth_bp
    from alerts.routes import alerts_bp
    from detection.routes import detection_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(detection_bp, url_prefix='/api/detection')

    # ─── Auto Start Phone Camera ──────────────────────────
    with app.app_context():
        _start_cameras(app)

    # ─── Health Check ─────────────────────────────────────
    @app.route('/api/health')
    def health():
        return jsonify({
            'success': True,
            'message': '✅ Accident Detection API is running!',
            'version': '1.0.0'
        }), 200

    # ─── JWT Error Handlers ───────────────────────────────
    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': '❌ Token has expired!'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token(error):
        return jsonify({
            'success': False,
            'message': '❌ Invalid token!'
        }), 401

    @jwt.unauthorized_loader
    def unauthorized(error):
        return jsonify({
            'success': False,
            'message': '❌ Token is missing!'
        }), 401

    return app


def _start_cameras(app):
    """Auto start cameras on app startup"""
    import os
    import threading
    from detection.camera_stream import get_camera_manager
    from alerts.alert_engine import get_alert_engine

    manager = get_camera_manager()
    alert_engine = get_alert_engine()

    # Camera 1 — Phone Camera
    camera_url = os.getenv('CAMERA_1_URL')
    camera_name = os.getenv('CAMERA_1_NAME', 'Phone Camera')
    camera_location = os.getenv('CAMERA_1_LOCATION', 'Highway Entry')

    if camera_url:
        def accident_callback(accident_data):
            thread = threading.Thread(
                target=alert_engine.process_accident,
                args=(app, accident_data),
                daemon=True
            )
            thread.start()

        manager.add_camera(
            'camera_1',
            camera_url,
            camera_name,
            camera_location,
            accident_callback
        )
        print(f"✅ {camera_name} started!")
        print(f"   URL: {camera_url}")
    else:
        print("⚠ No camera URL configured in .env")


# ─── Run App ──────────────────────────────────────────────
if __name__ == '__main__':
    app = create_app('development')
    print("🚀 Starting Accident Detection System...")
    print("📡 Backend running at http://localhost:5000")
    print("🎯 YOLOv8 detection active!")
    socketio.run(
        app,
        debug=True,
        host='0.0.0.0',
        port=5000
    )