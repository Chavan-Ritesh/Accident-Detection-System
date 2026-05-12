from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime
from database import db
from auth.models import Accident, Alert
from alerts.alert_engine import get_alert_engine

alerts_bp = Blueprint('alerts', __name__)


# ─── GET ALL ALERTS ───────────────────────────────────────────────────────────
@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        # Filters
        severity = request.args.get('severity')
        accident_type = request.args.get('type')
        acknowledged = request.args.get('acknowledged')
        limit = int(request.args.get('limit', 50))

        query = Alert.query.join(Accident)

        if severity:
            query = query.filter(Alert.severity == severity)
        if accident_type:
            query = query.filter(Accident.accident_type == accident_type)
        if acknowledged is not None:
            query = query.filter(
                Alert.acknowledged == (acknowledged.lower() == 'true')
            )

        alerts = query.order_by(
            Alert.created_at.desc()
        ).limit(limit).all()

        return jsonify({
            'success': True,
            'count': len(alerts),
            'alerts': [a.to_dict() for a in alerts]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET SINGLE ALERT ─────────────────────────────────────────────────────────
@alerts_bp.route('/<int:alert_id>', methods=['GET'])
@jwt_required()
def get_alert(alert_id):
    try:
        alert = Alert.query.get(alert_id)
        if not alert:
            return jsonify({
                'success': False,
                'message': '❌ Alert not found!'
            }), 404

        return jsonify({
            'success': True,
            'alert': alert.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── ACKNOWLEDGE ALERT ────────────────────────────────────────────────────────
@alerts_bp.route('/<int:alert_id>/acknowledge', methods=['POST'])
@jwt_required()
def acknowledge_alert(alert_id):
    try:
        claims = get_jwt()
        username = claims.get('username')

        engine = get_alert_engine()
        success, message = engine.acknowledge_alert(alert_id, username)

        if success:
            return jsonify({
                'success': True,
                'message': message
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET ALL ACCIDENTS ────────────────────────────────────────────────────────
@alerts_bp.route('/accidents', methods=['GET'])
@jwt_required()
def get_accidents():
    try:
        accident_type = request.args.get('type')
        camera_id = request.args.get('camera_id')
        limit = int(request.args.get('limit', 50))

        query = Accident.query

        if accident_type:
            query = query.filter(
                Accident.accident_type == accident_type
            )
        if camera_id:
            query = query.filter(
                Accident.camera_id == camera_id
            )

        accidents = query.order_by(
            Accident.timestamp.desc()
        ).limit(limit).all()

        return jsonify({
            'success': True,
            'count': len(accidents),
            'accidents': [a.to_dict() for a in accidents]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
@alerts_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    try:
        from sqlalchemy import func

        total_accidents = Accident.query.count()
        total_alerts = Alert.query.count()
        unacknowledged = Alert.query.filter_by(
            acknowledged=False
        ).count()
        acknowledged = Alert.query.filter_by(
            acknowledged=True
        ).count()

        # Count by accident type
        collisions = Accident.query.filter_by(
            accident_type='COLLISION'
        ).count()
        person_hits = Accident.query.filter_by(
            accident_type='PERSON_HIT'
        ).count()
        rollovers = Accident.query.filter_by(
            accident_type='ROLLOVER'
        ).count()

        # Count by severity
        critical = Alert.query.filter_by(severity='CRITICAL').count()
        high = Alert.query.filter_by(severity='HIGH').count()
        medium = Alert.query.filter_by(severity='MEDIUM').count()
        low = Alert.query.filter_by(severity='LOW').count()

        return jsonify({
            'success': True,
            'stats': {
                'total_accidents': total_accidents,
                'total_alerts': total_alerts,
                'unacknowledged': unacknowledged,
                'acknowledged': acknowledged,
                'by_type': {
                    'collisions': collisions,
                    'person_hits': person_hits,
                    'rollovers': rollovers,
                },
                'by_severity': {
                    'critical': critical,
                    'high': high,
                    'medium': medium,
                    'low': low,
                }
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500