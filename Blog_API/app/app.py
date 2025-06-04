# Blog_API/app/app.py
import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt # IMPORTACIÓN
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager

load_dotenv()
jwt = JWTManager()
# Importar modelos DESPUÉS de db, pero antes de usarlos en la factory si es necesario
# o dentro de la factory si hay dependencias circulares que evitar.
# Por ahora, asumimos que los modelos no dependen directamente de 'app' en su definición inicial.
from .models import db # Models usa 'db', que se inicializa aquí.
# Los modelos como Autor, que usan current_app.extensions['bcrypt'],
# lo harán cuando se llamen sus métodos, momento en el cual la app ya debería estar configurada.

from .routes import main_bp
# Puedes crear la instancia de bcrypt aquí
bcrypt = Bcrypt()


def create_app():
    current_app = Flask(__name__)
    CORS(current_app, resources={r"/*": {"origins": "*"}})

    database_uri = os.getenv('DATABASE_URI')
    if not database_uri:
        raise RuntimeError("DATABASE_URI no está configurada en las variables de entorno.")
    
    current_app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    current_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    current_app.config['SQLALCHEMY_ECHO'] = False
    # ... otras configuraciones de la app ...
    current_app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY') # Asegúrate de tener esto para JWT

    # Inicializar extensiones
    db.init_app(current_app)
    bcrypt.init_app(current_app) # <--- INICIALIZACIÓN DE BCRYPT CON LA APP
    jwt.init_app(current_app)  # O con 'app' si usas 'app = Flask(__name__)'

    # Registrar Blueprints
    current_app.register_blueprint(main_bp) # Puedes añadir un prefijo, ej: url_prefix='/api'
    return current_app

app = create_app() 

if __name__ == '__main__':
    port = int(os.getenv('FLASK_RUN_PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, port=port, host='0.0.0.0')