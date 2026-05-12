from flask import Blueprint, Response, jsonify, request
from flask_jwt_extended import jwt_required
from detection.camera_stream import get_camera_manager
from detection.yolo_engine import get_yolo_engine
import os

detection_bp = Blueprint('detection', __name__)


# ─── GET LIVE STREAM ──────────────────────────────────────────────────────────
@detection_bp.route('/stream/<camera_id>')
def stream(camera_id):
    """Stream live video feed with detection overlay"""
    try:
        manager = get_camera_manager()
        camera = manager.get_camera(camera_id)

        if not camera:
            return jsonify({
                'success': False,
                'message': f'❌ Camera {camera_id} not found!'
            }), 404

        def generate():
            while True:
                frame = camera.get_frame()
                if frame:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n'
                        + frame +
                        b'\r\n'
                    )

        return Response(
            generate(),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Stream error: {str(e)}'
        }), 500


# ─── GET ALL CAMERAS STATUS ───────────────────────────────────────────────────
@detection_bp.route('/cameras', methods=['GET'])
@jwt_required()
def get_cameras():
    """Get status of all cameras"""
    try:
        manager = get_camera_manager()
        cameras = manager.get_all_status()

        return jsonify({
            'success': True,
            'count': len(cameras),
            'cameras': cameras
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── START CAMERA ─────────────────────────────────────────────────────────────
@detection_bp.route('/cameras/start', methods=['POST'])
@jwt_required()
def start_camera():
    """Start a camera stream"""
    try:
        data = request.get_json()

        camera_id = data.get('camera_id')
        url = data.get('url')
        name = data.get('name', f'Camera {camera_id}')
        location = data.get('location', 'Highway')

        if not camera_id or not url:
            return jsonify({
                'success': False,
                'message': '❌ camera_id and url are required!'
            }), 400

        from alerts.alert_engine import get_alert_engine
        from flask import current_app
        app = current_app._get_current_object()
        alert_engine = get_alert_engine()

        def accident_callback(accident_data):
            import threading
            thread = threading.Thread(
                target=alert_engine.process_accident,
                args=(app, accident_data),
                daemon=True
            )
            thread.start()

        manager = get_camera_manager()
        manager.add_camera(
            camera_id, url, name,
            location, accident_callback
        )

        return jsonify({
            'success': True,
            'message': f'✅ Camera {name} started!'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── STOP CAMERA ──────────────────────────────────────────────────────────────
@detection_bp.route('/cameras/stop', methods=['POST'])
@jwt_required()
def stop_camera():
    """Stop a camera stream"""
    try:
        data = request.get_json()
        camera_id = data.get('camera_id')

        if not camera_id:
            return jsonify({
                'success': False,
                'message': '❌ camera_id is required!'
            }), 400

        manager = get_camera_manager()
        camera = manager.get_camera(camera_id)

        if not camera:
            return jsonify({
                'success': False,
                'message': f'❌ Camera {camera_id} not found!'
            }), 404

        camera.stop()

        return jsonify({
            'success': True,
            'message': f'✅ Camera {camera_id} stopped!'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET YOLO STATUS ──────────────────────────────────────────────────────────
@detection_bp.route('/yolo/status', methods=['GET'])
@jwt_required()
def yolo_status():
    """Get YOLOv8 model status"""
    try:
        import torch
        engine = get_yolo_engine()

        return jsonify({
            'success': True,
            'status': {
                'model_loaded': engine is not None,
                'device': 'cuda' if torch.cuda.is_available() else 'cpu',
                'confidence': float(
                    os.getenv('DETECTION_CONFIDENCE', 0.5)
                ),
                'detect_collision': os.getenv(
                    'DETECT_COLLISION', 'True'
                ) == 'True',
                'detect_rollover': os.getenv(
                    'DETECT_ROLLOVER', 'True'
                ) == 'True',
                'detect_person_hit': os.getenv(
                    'DETECT_PERSON_HIT', 'True'
                ) == 'True',
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500