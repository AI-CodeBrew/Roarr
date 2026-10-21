from flask import Flask
from flask_cors import CORS
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)

    # Suppress specific noisy loggers
    logging.getLogger('app.theme_utils').setLevel(logging.WARNING)
    logging.getLogger('google_genai.models').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)

    CORS(app,resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "X-Access-Token","ngrok-skip-browser-warning"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Register module blueprints
    from .modules.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    from .modules.events import events_bp
    app.register_blueprint(events_bp)
    
    from .modules.shopify.shopify_auth import shopify_auth_bp
    app.register_blueprint(shopify_auth_bp)
    
    from .modules.shopify.shopify_core import shopify_core_bp
    app.register_blueprint(shopify_core_bp)
    
    from .modules.subscription import subscription_bp
    app.register_blueprint(subscription_bp)

    from .modules.credits.routes import credits_bp
    app.register_blueprint(credits_bp)
    
    from .modules.license import license_bp
    app.register_blueprint(license_bp)
    
    from .modules.debug import debug_bp
    app.register_blueprint(debug_bp)
    
    from .modules.emagen import emagen_bp
    app.register_blueprint(emagen_bp)
    
    from .modules.system import system_bp
    app.register_blueprint(system_bp)
    
    from .modules.scraping import scraping_bp
    app.register_blueprint(scraping_bp)
    
    from .modules.generate import generate_bp
    app.register_blueprint(generate_bp)
    
    from .modules.insights import insights_bp
    app.register_blueprint(insights_bp)
    
    from .modules.bundler import bundler_bp
    app.register_blueprint(bundler_bp)
    
    from .modules.brand_dna import brand_dna_bp
    app.register_blueprint(brand_dna_bp)

    @app.route('/')
    def root():
        return {'message': 'Zambeel Backend API', 'status': 'running'}, 200

    return app
