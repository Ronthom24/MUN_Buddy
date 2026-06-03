from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.country import Country

bp = Blueprint('countries', __name__, url_prefix='/countries')


@bp.route('/', methods=['GET'])
def list_countries():
    countries = Country.query.all()
    return jsonify([c.to_dict() for c in countries])


@bp.route('/', methods=['POST'])
def create_country():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'name required'}), 400

    country = Country(name=name)
    db.session.add(country)
    db.session.commit()
    return jsonify(country.to_dict()), 201
