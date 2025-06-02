from flask import Blueprint, request, jsonify, current_app
import re
from sqlalchemy.exc import IntegrityError
from .models import db, Autor, Entrada, Comentario, Categoria, MensajeContacto
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt # Para roles/claims
from functools import wraps 
main_bp = Blueprint('main', __name__)

# --- Decorador para rutas de Administrador ---
def admin_required(fn):
    @wraps(fn)
    @jwt_required() 
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = Autor.query.get(current_user_id)
        if user and user.is_admin:
            return fn(*args, **kwargs)
        else:
            return jsonify(msg="Acceso denegado: Se requieren permisos de administrador."), 403
    return wrapper

# --- Rutas de Autenticación ---
@main_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('contrasena'):
        return jsonify({"msg": "Faltan email o contraseña"}), 400

    email = data.get('email')
    contrasena = data.get('contrasena')

    autor = Autor.query.filter_by(email=email).first()
    if autor and autor.check_password(contrasena):
        access_token = create_access_token(identity=autor.id) # Puedes añadir más claims si es necesario
        return jsonify(access_token=access_token, user_id=autor.id, is_admin=autor.is_admin), 200 # Devolver is_admin puede ser útil para el frontend
    else:
        return jsonify({"msg": "Email o contraseña incorrectos"}), 401

# --- Rutas de Autores ---
@main_bp.route('/autores', methods=['GET'])
def get_autores():
    try:
        autores = Autor.query.all()
        return jsonify([autor.serialize() for autor in autores]), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener autores: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al obtener autores.'}), 500

@main_bp.route('/autores/<int:autor_id>', methods=['GET'])
def get_autor_by_id(autor_id):
    try:
        autor = Autor.query.get(autor_id)
        if not autor:
            return jsonify({'message': 'Autor no encontrado'}), 404
        return jsonify(autor.serialize()), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener autor por ID {autor_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al obtener autor {autor_id}.'}), 500

@main_bp.route('/autores', methods=['POST'])
@admin_required # Solo administradores pueden crear autores
def create_autor():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Datos JSON requeridos'}), 400

        nombre = data.get('nombre')
        email = data.get('email')
        contrasena = data.get('contrasena') # Nueva contraseña
        is_admin_request = data.get('is_admin', False) # Opcional: permitir que un admin cree otro admin

        if not nombre or not email or not contrasena:
            return jsonify({'message': 'Nombre, email y contraseña son requeridos'}), 400

        existing_autor = Autor.query.filter_by(email=email).first()
        if existing_autor:
            return jsonify({'message': 'El email ya está registrado'}), 409

        new_autor = Autor(nombre=nombre, email=email, is_admin=is_admin_request)
        new_autor.set_password(contrasena) # Hashear la contraseña
        db.session.add(new_autor)
        db.session.commit()

        return jsonify(new_autor.serialize()), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al crear autor: {str(e.orig)}")
        return jsonify({'message': 'Error de integridad en la base de datos al crear autor.', 'details': str(e.orig)}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al crear autor: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al crear el autor.'}), 500

@main_bp.route('/autores/<int:autor_id>', methods=['PUT'])
@jwt_required() 
def update_autor(autor_id):
    current_user_id = get_jwt_identity()
    autor_to_update = Autor.query.get_or_404(autor_id)
    current_user = Autor.query.get(current_user_id)

    if not current_user: 
        return jsonify({"msg": "Usuario actual no encontrado."}), 403


    if not current_user.is_admin and current_user_id != autor_to_update.id:
        return jsonify({"msg": "No tienes permiso para modificar este autor."}), 403

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Datos JSON requeridos'}), 400

    try:
        if 'nombre' in data:
            autor_to_update.nombre = data['nombre']
        if 'email' in data and data['email'] != autor_to_update.email:
            existing_autor = Autor.query.filter(Autor.email == data['email'], Autor.id != autor_id).first()
            if existing_autor:
                return jsonify({'message': 'El nuevo email ya está registrado por otro usuario.'}), 409
            autor_to_update.email = data['email']
        if 'biografia' in data:
            autor_to_update.biografia = data['biografia']
        
        if 'is_admin' in data and current_user.is_admin:
             autor_to_update.is_admin = bool(data['is_admin'])
        elif 'is_admin' in data and not current_user.is_admin:
            return jsonify({"msg": "No tienes permiso para cambiar el estado de administrador."}), 403


        if 'contrasena' in data and data['contrasena']: # Si se provee nueva contraseña
            if not current_user.is_admin and current_user_id != autor_to_update.id:
                 return jsonify({"msg": "No tienes permiso para cambiar la contraseña de este autor."}), 403
            autor_to_update.set_password(data['contrasena'])
            
        db.session.commit()
        return jsonify(autor_to_update.serialize()), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al actualizar autor {autor_id}: {str(e.orig)}")
        # Comprobar si el error es por email duplicado
        if 'autor.email' in str(e.orig).lower(): # Ajusta según tu motor de BD y mensaje de error
             return jsonify({'message': 'Error: El email proporcionado ya existe.'}), 409
        return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al actualizar autor {autor_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al actualizar autor {autor_id}.'}), 500


@main_bp.route('/autores/<int:autor_id>', methods=['DELETE'])
@admin_required # Solo administradores pueden eliminar autores
def delete_autor(autor_id):
    try:
        autor = Autor.query.get(autor_id)
        if not autor:
            return jsonify({'message': 'Autor no encontrado.'}), 404
        
        # Opcional: impedir que un admin se elimine a sí mismo o manejarlo
        current_user_id = get_jwt_identity()
        if autor.id == current_user_id:
            return jsonify({'message': 'No puedes eliminar tu propia cuenta de administrador por esta vía.'}), 403

        # Opcional: ¿Qué pasa con las entradas de este autor?
        # Podrías reasignarlas, eliminarlas, o impedir la eliminación si tiene entradas.
        if autor.entradas:
             return jsonify({'message': 'No se puede eliminar el autor porque tiene entradas asociadas. Por favor, reasigne o elimine sus entradas primero.'}), 409


        db.session.delete(autor)
        db.session.commit()
        return jsonify({'message': 'Autor eliminado exitosamente.'}), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al eliminar autor {autor_id}: {str(e.orig)}")
        return jsonify({'message': 'Error de integridad: No se pudo eliminar el autor.', 'details': str(e.orig)}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al eliminar autor {autor_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al eliminar el autor {autor_id}.'}), 500

# --- Rutas de Categorías ---
def generar_slug(nombre):
    slug = nombre.lower()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'[^\w\-]+', '', slug)
    slug = re.sub(r'\-{2,}', '-', slug)
    slug = slug.strip('-')
    return slug

@main_bp.route('/categorias/POST', methods=['POST'])
@admin_required # Solo administradores pueden crear categorías
def create_categoria():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    # Adaptado para los campos multi-idioma del modelo Categoria
    nombre_es = data.get('nombre_es')
    nombre_en = data.get('nombre_en')
    nombre_de = data.get('nombre_de')
    slug_propuesto = data.get('slug')
    descripcion = data.get('descripcion') # Asegúrate que el modelo Categoria tenga este campo

    if not nombre_es: # Asumimos que nombre_es es el primario y obligatorio
        return jsonify({'message': 'El campo "nombre_es" (nombre en español) es obligatorio.'}), 400

    slug_final = slug_propuesto if slug_propuesto else generar_slug(nombre_es)
    
    # Verificar unicidad de slug (y nombres si es necesario)
    if Categoria.query.filter_by(slug=slug_final).first():
        return jsonify({'message': f'Error: El slug "{slug_final}" ya existe.'}), 409
    if Categoria.query.filter_by(nombre_es=nombre_es).first(): # Si nombre_es también debe ser único
        return jsonify({'message': f'Error: El nombre en español "{nombre_es}" ya existe.'}), 409

    nueva_categoria = Categoria(
        nombre_es=nombre_es,
        nombre_en=nombre_en,
        nombre_de=nombre_de,
        slug=slug_final,
        descripcion=descripcion
    )
    try:
        db.session.add(nueva_categoria)
        db.session.commit()
        return jsonify(nueva_categoria.serialize()), 201
    except IntegrityError as e:
        db.session.rollback()
        # El chequeo explícito de arriba debería prevenir la mayoría de estos, pero por si acaso:
        if 'categorias.slug' in str(e.orig):
             return jsonify({'message': 'Error: El slug de la categoría ya existe.'}), 409
        elif 'categorias.nombre_es' in str(e.orig): # Si tienes constraint unique en nombre_es
             return jsonify({'message': 'Error: El nombre (ES) de la categoría ya existe.'}), 409
        else:
            current_app.logger.error(f"Error de integridad al crear categoría: {str(e.orig)}")
            return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error general al crear categoría: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al crear la categoría.'}), 500


@main_bp.route('/categorias', methods=['GET'])
def get_categorias():
    try:
        categorias = Categoria.query.all()
        return jsonify([categoria.serialize() for categoria in categorias]), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener categorías: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al obtener categorías.'}), 500

@main_bp.route('/categorias/<int:categoria_id>', methods=['GET'])
def get_categoria_by_id(categoria_id):
    try:
        categoria = Categoria.query.get(categoria_id)
        if not categoria:
            return jsonify({'message': 'Categoría no encontrada.'}), 404
        return jsonify(categoria.serialize()), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener categoría {categoria_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al obtener categoría {categoria_id}.'}), 500

@main_bp.route('/categorias/<int:categoria_id>', methods=['PUT'])
@admin_required # Solo administradores pueden actualizar categorías
def update_categoria(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    try:
        if 'nombre_es' in data:
            # Verificar si el nuevo nombre_es ya existe para otra categoría
            if data['nombre_es'] != categoria.nombre_es and Categoria.query.filter(Categoria.nombre_es == data['nombre_es'], Categoria.id != categoria_id).first():
                return jsonify({'message': f'Error: El nombre en español "{data["nombre_es"]}" ya existe.'}), 409
            categoria.nombre_es = data['nombre_es']
            # Si se cambia el nombre_es, regenerar slug si no se proporciona uno nuevo y el actual se basaba en el nombre_es antiguo
            if 'slug' not in data or not data['slug']:
                 # Lógica más compleja podría ser necesaria si el slug actual no es derivado de nombre_es
                 categoria.slug = generar_slug(data['nombre_es'])


        if 'nombre_en' in data: categoria.nombre_en = data['nombre_en']
        if 'nombre_de' in data: categoria.nombre_de = data['nombre_de']
        if 'descripcion' in data: categoria.descripcion = data['descripcion']
        
        if 'slug' in data and data['slug']:
            if data['slug'] != categoria.slug and Categoria.query.filter(Categoria.slug == data['slug'], Categoria.id != categoria_id).first():
                return jsonify({'message': f'Error: El slug "{data["slug"]}" ya existe.'}), 409
            categoria.slug = data['slug']
        
        db.session.commit()
        return jsonify(categoria.serialize()), 200
    except IntegrityError as e:
        db.session.rollback()
        # Chequeos explícitos deberían cubrir la mayoría, pero como fallback:
        if 'categorias.slug' in str(e.orig):
             return jsonify({'message': 'Error: El slug de la categoría ya existe.'}), 409
        elif 'categorias.nombre_es' in str(e.orig):
             return jsonify({'message': 'Error: El nombre (ES) de la categoría ya existe.'}), 409
        else:
            current_app.logger.error(f"Error de integridad al actualizar categoría {categoria_id}: {str(e.orig)}")
            return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error general al actualizar categoría {categoria_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al actualizar categoría {categoria_id}.'}), 500

@main_bp.route('/categorias/<int:categoria_id>', methods=['DELETE'])
@admin_required # Solo administradores pueden eliminar categorías
def delete_categoria(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    try:
        # Verificar si hay entradas asociadas a esta categoría
        if Entrada.query.filter_by(categoria_id=categoria_id).first():
            return jsonify({'message': 'Error: No se puede eliminar la categoría porque tiene entradas asociadas. Reasigne o elimine las entradas primero.'}), 409
            
        db.session.delete(categoria)
        db.session.commit()
        return jsonify({'message': 'Categoría eliminada exitosamente.'}), 200
    except IntegrityError as e: # Poco probable si la verificación de entradas asociadas se hace primero
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al eliminar categoría {categoria_id}: {str(e.orig)}")
        return jsonify({'message': 'Error de integridad: No se pudo eliminar la categoría.', 'details': str(e.orig)}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al eliminar categoría {categoria_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al eliminar categoría {categoria_id}.'}), 500

@main_bp.route('/mensajecontacto', methods=['POST'])
def create_contacto():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Datos JSON requeridos'}), 400

        nombre = data.get('nombre_remitente')
        email = data.get('email_remitente')
        asunto = data.get('asunto')
        mensaje = data.get('mensaje')

        if not nombre or not email: # Asunto y mensaje pueden ser opcionales según tu lógica de frontend
            return jsonify({'message': 'Nombre y email son requeridos'}), 400
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'message': 'Formato de email inválido'}), 400
        if not mensaje:
            return jsonify({'message': 'El mensaje es requerido'}), 400


        new_contacto = MensajeContacto(
            nombre_remitente=nombre,
            email_remitente=email,
            asunto=asunto,
            mensaje=mensaje
        )
        db.session.add(new_contacto)
        db.session.commit()
        return jsonify(new_contacto.__dict__), 201 # O una serialización más controlada
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al crear mensaje de contacto: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al procesar el mensaje de contacto.'}), 500

@main_bp.route('/entradas', methods=['GET'])
def get_entradas():
    slug = request.args.get('slug')
    try:
        if slug:
            entrada = Entrada.query.filter_by(slug=slug).first()
            if entrada:
                return jsonify(entrada.serialize())
            else:
                return jsonify({'message': 'Entrada no encontrada con ese slug'}), 404
        else:
            entradas = Entrada.query.order_by(Entrada.fecha_publicacion.desc()).all()
            return jsonify([entrada.serialize() for entrada in entradas]), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener entradas: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al obtener entradas.'}), 500

