import os
from flask import Flask, jsonify # request no se usa directamente aquí, pero podría ser usado en blueprints
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Importar la instancia de db y los modelos.
# Esto asume que models.py define 'db = SQLAlchemy()' y tus modelos.
from .models import db, Autor, Entrada, Comentario # Asegúrate que estos modelos estén definidos en models.py

# Importar el Blueprint principal para las rutas.
# Esto asume que routes.py define 'main_bp = Blueprint(...)' y sus rutas.
from .routes import main_bp

def create_app():
    """
    Factory para crear y configurar la aplicación Flask.
    """
    current_app = Flask(__name__)

    # Configuración de CORS: permitir solicitudes desde cualquier origen.
    # Para producción, considera restringir los orígenes:
    # CORS(current_app, resources={r"/api/*": {"origins": "https://tufrontend.com"}})
    CORS(current_app, resources={r"/*": {"origins": "*"}})  # <--- Esto permite CORS para todo

    # Configuración de la base de datos
    database_uri = os.getenv('DATABASE_URI')
    if not database_uri:
        raise RuntimeError("DATABASE_URI no está configurada en las variables de entorno.")
    
    current_app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    current_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    current_app.config['SQLALCHEMY_ECHO'] = False # Pon en True para ver las queries SQL generadas (útil para debug)

    # Inicializar la extensión SQLAlchemy con la aplicación
    db.init_app(current_app)

    # Registrar Blueprints
    current_app.register_blueprint(main_bp) # Tu blueprint principal, usualmente con prefijo como /api

    # Ruta simple de prueba

    return current_app

# Crear la aplicación usando la factory
app = create_app()

# El siguiente bloque es para ejecutar la aplicación directamente con 'python app.py'.
# Es útil para desarrollo local. Para producción, se suele usar un servidor WSGI como Gunicorn o Waitress.
if __name__ == '__main__':
    # Considera obtener el puerto y el modo debug de variables de entorno también
    port = int(os.getenv('FLASK_RUN_PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, port=port, host='0.0.0.0')
