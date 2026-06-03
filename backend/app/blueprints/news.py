from flask import Blueprint, jsonify

bp = Blueprint('news', __name__, url_prefix='/news')


@bp.route('/')
def latest_news():
    # lightweight static sample; integrate with a real source/service later
    sample = [
        {'id': 1, 'title': 'Global Climate Talks Resume in Geneva', 'tag': 'breaking'},
        {'id': 2, 'title': 'UN Security Council Passes Ceasefire Resolution', 'tag': 'update'},
    ]
    return jsonify(sample)
