from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from datetime import datetime


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()

            if claims.get('role') != 'admin':
                return jsonify({
                    'success': False,
                    'message': '❌ Admin access required!'
                }), 403

            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'❌ Unauthorized: {str(e)}'
            }), 401
    return wrapper


def operator_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            claims = get_jwt()

            if claims.get('role') not in ['admin', 'operator']:
                return jsonify({
                    'success': False,
                    'message': '❌ Operator access required!'
                }), 403

            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'❌ Unauthorized: {str(e)}'
            }), 401
    return wrapper


def get_current_user():
    try:
        claims = get_jwt()
        return {
            'id': claims.get('user_id'),
            'username': claims.get('username'),
            'role': claims.get('role')
        }
    except Exception:
        return None