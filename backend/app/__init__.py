from flask import Flask, send_from_directory
from pathlib import Path

from .config import Config
from .extensions import db, migrate


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(Config)

    # initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # register blueprints
    from .blueprints.users import bp as users_bp
    from .blueprints.countries import bp as countries_bp
    from .blueprints.news import bp as news_bp

    app.register_blueprint(users_bp)
    app.register_blueprint(countries_bp)
    app.register_blueprint(news_bp)

    @app.route('/')
    def home():
        frontend_path = Path(__file__).resolve().parents[2] / "frontend"
        return send_from_directory(frontend_path, "index.html")

    @app.route('/login')
    def login():
        frontend_path = Path(__file__).resolve().parents[2] / "frontend"
        return send_from_directory(frontend_path, "login.html")

    return app