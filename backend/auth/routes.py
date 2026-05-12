from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from datetime import datetime
import bcrypt

from database import db
from auth.models import User

auth_bp = Blueprint('auth', __name__)


# ─── REGISTER (Admin only can create users) ───────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        required = ['username', 'password', 'email', 'role']
        for field in required:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'❌ {field} is required!'
                }), 400

        # Validate role
        if data['role'] not in ['admin', 'operator']:
            return jsonify({
                'success': False,
                'message': '❌ Role must be admin or operator!'
            }), 400

        # Check if username exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'success': False,
                'message': '❌ Username already exists!'
            }), 409

        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'message': '❌ Email already exists!'
            }), 409

        # Hash password
        hashed = bcrypt.hashpw(
            data['password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Create user
        user = User(
            username=data['username'],
            password=hashed,
            email=data['email'],
            role=data['role'],
            is_active=True,
            created_at=datetime.utcnow()
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'✅ User {data["username"]} created successfully!',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── LOGIN ────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Validate fields
        if not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': '❌ Username and password are required!'
            }), 400

        # Find user
        user = User.query.filter_by(username=data['username']).first()

        if not user:
            return jsonify({
                'success': False,
                'message': '❌ Invalid username or password!'
            }), 401

        # Check if active
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': '❌ Account is disabled!'
            }), 401

        # Check role
        if user.role not in ['admin', 'operator']:
            return jsonify({
                'success': False,
                'message': '❌ Access denied!'
            }), 403

        # Verify password
        if not bcrypt.checkpw(
            data['password'].encode('utf-8'),
            user.password.encode('utf-8')
        ):
            return jsonify({
                'success': False,
                'message': '❌ Invalid username or password!'
            }), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create JWT token
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'username': user.username,
                'role': user.role,
                'email': user.email,
                'user_id': user.id
            }
        )

        return jsonify({
            'success': True,
            'message': f'✅ Welcome back, {user.username}!',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET ALL USERS (Admin only) ───────────────────────────────────────────────
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': '❌ Admin access required!'
            }), 403

        users = User.query.all()
        return jsonify({
            'success': True,
            'users': [u.to_dict() for u in users]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── GET CURRENT USER PROFILE ─────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        claims = get_jwt()
        user = User.query.get(claims.get('user_id'))

        if not user:
            return jsonify({
                'success': False,
                'message': '❌ User not found!'
            }), 404

        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'❌ Error: {str(e)}'
        }), 500


# ─── LOGOUT ───────────────────────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({
        'success': True,
        'message': '✅ Logged out successfully!'
    }), 200