from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.user import User

bp = Blueprint('users', __name__, url_prefix='/users')


@bp.route('/', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@bp.route('/', methods=['POST'])
def create_user():

    data = request.get_json() or {}

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({
            'error': 'username, email and password required'
        }), 400

    user = User(
        username=username,
        email=email,
        password_hash=password
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201