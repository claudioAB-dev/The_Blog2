from flask import Blueprint, request, jsonify, current_app
import re
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_ # <--- IMPORTACIÓN AÑADIDA
from .models import db, Autor, Entrada, Comentario, Categoria, MensajeContacto
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt 
from functools import wraps
from datetime import datetime # <--- IMPORTACIÓN AÑADIDA

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

def generar_slug(nombre):
    slug = nombre.lower()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'[^\w\-]+', '', slug) # Permite alfanuméricos, guiones bajos y guiones
    slug = re.sub(r'\-{2,}', '-', slug)
    slug = slug.strip('-')
    return slug

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
        access_token = create_access_token(identity=autor.id)
        return jsonify(access_token=access_token, user_id=autor.id, is_admin=autor.is_admin), 200
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
@admin_required
def create_autor():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Datos JSON requeridos'}), 400

        nombre = data.get('nombre')
        email = data.get('email')
        contrasena = data.get('contrasena')
        is_admin_request = data.get('is_admin', False)

        if not nombre or not email or not contrasena:
            return jsonify({'message': 'Nombre, email y contraseña son requeridos'}), 400

        existing_autor = Autor.query.filter_by(email=email).first()
        if existing_autor:
            return jsonify({'message': 'El email ya está registrado'}), 409

        new_autor = Autor(nombre=nombre, email=email, is_admin=is_admin_request)
        new_autor.set_password(contrasena)
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

        if 'contrasena' in data and data['contrasena']:
            if not current_user.is_admin and current_user_id != autor_to_update.id:
                 return jsonify({"msg": "No tienes permiso para cambiar la contraseña de este autor."}), 403
            autor_to_update.set_password(data['contrasena'])

        db.session.commit()
        return jsonify(autor_to_update.serialize()), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al actualizar autor {autor_id}: {str(e.orig)}")
        if 'autor.email' in str(e.orig).lower():
             return jsonify({'message': 'Error: El email proporcionado ya existe.'}), 409
        return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al actualizar autor {autor_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al actualizar autor {autor_id}.'}), 500

@main_bp.route('/autores/<int:autor_id>', methods=['DELETE'])
@admin_required
def delete_autor(autor_id):
    try:
        autor = Autor.query.get(autor_id)
        if not autor:
            return jsonify({'message': 'Autor no encontrado.'}), 404

        current_user_id = get_jwt_identity()
        if autor.id == current_user_id:
            return jsonify({'message': 'No puedes eliminar tu propia cuenta de administrador por esta vía.'}), 403

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
@main_bp.route('/categorias/POST', methods=['POST']) # Renombrada para claridad, podría ser solo /categorias con POST
@admin_required
def create_categoria():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    nombre_es = data.get('nombre_es')
    nombre_en = data.get('nombre_en')
    nombre_de = data.get('nombre_de')
    slug_propuesto = data.get('slug')
    descripcion = data.get('descripcion') 

    if not nombre_es:
        return jsonify({'message': 'El campo "nombre_es" (nombre en español) es obligatorio.'}), 400

    slug_final = slug_propuesto.strip() if slug_propuesto and slug_propuesto.strip() else generar_slug(nombre_es)
    if not slug_final:
        return jsonify({'message': 'No se pudo generar o usar un slug válido.'}), 400


    if Categoria.query.filter_by(slug=slug_final).first():
        return jsonify({'message': f'Error: El slug "{slug_final}" ya existe.'}), 409
    if Categoria.query.filter_by(nombre_es=nombre_es).first():
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
        if 'categorias.slug' in str(e.orig):
             return jsonify({'message': 'Error: El slug de la categoría ya existe (error de integridad).'}), 409
        elif 'categorias.nombre_es' in str(e.orig):
             return jsonify({'message': 'Error: El nombre (ES) de la categoría ya existe (error de integridad).'}), 409
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
@admin_required
def update_categoria(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    try:
        if 'nombre_es' in data:
            if data['nombre_es'] != categoria.nombre_es and Categoria.query.filter(Categoria.nombre_es == data['nombre_es'], Categoria.id != categoria_id).first():
                return jsonify({'message': f'Error: El nombre en español "{data["nombre_es"]}" ya existe.'}), 409
            categoria.nombre_es = data['nombre_es']
            if 'slug' not in data or not data['slug'].strip():
                 categoria.slug = generar_slug(data['nombre_es'])

        if 'nombre_en' in data: categoria.nombre_en = data.get('nombre_en')
        if 'nombre_de' in data: categoria.nombre_de = data.get('nombre_de')
        if 'descripcion' in data: categoria.descripcion = data.get('descripcion')

        if 'slug' in data and data['slug'].strip():
            nuevo_slug = generar_slug(data['slug'].strip())
            if not nuevo_slug:
                 return jsonify({'message': 'El slug proporcionado es inválido.'}), 400
            if nuevo_slug != categoria.slug and Categoria.query.filter(Categoria.slug == nuevo_slug, Categoria.id != categoria_id).first():
                return jsonify({'message': f'Error: El slug "{nuevo_slug}" ya existe.'}), 409
            categoria.slug = nuevo_slug

        db.session.commit()
        return jsonify(categoria.serialize()), 200
    except IntegrityError as e:
        db.session.rollback()
        if 'categorias.slug' in str(e.orig):
             return jsonify({'message': 'Error: El slug de la categoría ya existe (error de integridad).'}), 409
        elif 'categorias.nombre_es' in str(e.orig):
             return jsonify({'message': 'Error: El nombre (ES) de la categoría ya existe (error de integridad).'}), 409
        else:
            current_app.logger.error(f"Error de integridad al actualizar categoría {categoria_id}: {str(e.orig)}")
            return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error general al actualizar categoría {categoria_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al actualizar categoría {categoria_id}.'}), 500

@main_bp.route('/categorias/<int:categoria_id>', methods=['DELETE'])
@admin_required
def delete_categoria(categoria_id):
    categoria = Categoria.query.get_or_404(categoria_id)
    try:
        if Entrada.query.filter_by(categoria_id=categoria_id).first():
            return jsonify({'message': 'Error: No se puede eliminar la categoría porque tiene entradas asociadas. Reasigne o elimine las entradas primero.'}), 409

        db.session.delete(categoria)
        db.session.commit()
        return jsonify({'message': 'Categoría eliminada exitosamente.'}), 200
    except IntegrityError as e:
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

        if not nombre or not email:
            return jsonify({'message': 'Nombre y email son requeridos'}), 400
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'message': 'Formato de email inválido'}), 400
        if not mensaje: # Asumiendo que el mensaje también es requerido
            return jsonify({'message': 'El mensaje es requerido'}), 400

        new_contacto = MensajeContacto(
            nombre_remitente=nombre,
            email_remitente=email,
            asunto=asunto,
            mensaje=mensaje
        )
        db.session.add(new_contacto)
        db.session.commit()
        # Considerar crear un método serialize() para MensajeContacto también
        return jsonify({
            'id': new_contacto.id,
            'nombre_remitente': new_contacto.nombre_remitente,
            'email_remitente': new_contacto.email_remitente,
            'asunto': new_contacto.asunto,
            'mensaje': new_contacto.mensaje,
            'fecha_envio': new_contacto.fecha_envio.isoformat() if new_contacto.fecha_envio else None,
            'leido': new_contacto.leido
        }), 201
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

# --- Endpoints CRUD para Entradas (Protegidos por Admin) ---
@main_bp.route('/admin/entradas', methods=['POST'])
@admin_required
def create_entrada():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    required_fields = ['autor_id', 'categoria_id', 'titulo_es', 'resumen_es', 'contenido_es']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'message': f'El campo "{field}" es obligatorio y no puede estar vacío.'}), 400

    if not Autor.query.get(data['autor_id']):
        return jsonify({'message': f'El autor con id {data["autor_id"]} no existe.'}), 404
    if not Categoria.query.get(data['categoria_id']):
        return jsonify({'message': f'La categoría con id {data["categoria_id"]} no existe.'}), 404

    slug_propuesto = data.get('slug', '').strip()
    if not slug_propuesto:
        slug_final = generar_slug(data['titulo_es'])
    else:
        slug_final = generar_slug(slug_propuesto)

    if not slug_final:
        return jsonify({'message': 'No se pudo generar un slug válido para la entrada. El título podría ser inválido.'}), 400

    if Entrada.query.filter_by(slug=slug_final).first():
        return jsonify({'message': f'El slug "{slug_final}" ya existe. Proporciona un slug único o modifica el título.'}), 409

    try:
        fecha_publicacion_str = data.get('fecha_publicacion')
        fecha_publicacion_dt = None
        if fecha_publicacion_str and data.get('estado') == 'publicado':
            try:
                fecha_publicacion_dt = datetime.fromisoformat(fecha_publicacion_str)
            except ValueError:
                return jsonify({'message': 'Formato de fecha_publicacion inválido. Usar ISO 8601.'}), 400
        
        nueva_entrada = Entrada(
            autor_id=data['autor_id'],
            categoria_id=data['categoria_id'],
            titulo_es=data['titulo_es'].strip(),
            slug=slug_final,
            resumen_es=data['resumen_es'].strip(),
            contenido_es=data['contenido_es'].strip(),
            imagen_destacada=data.get('imagen_destacada', '').strip() or None,
            estado=data.get('estado', 'borrador'),
            fecha_publicacion=fecha_publicacion_dt,
            titulo_en=data.get('titulo_en', '').strip() or None,
            resumen_en=data.get('resumen_en', '').strip() or None,
            contenido_en=data.get('contenido_en', '').strip() or None,
            titulo_de=data.get('titulo_de', '').strip() or None,
            resumen_de=data.get('resumen_de', '').strip() or None,
            contenido_de=data.get('contenido_de', '').strip() or None
        )
        db.session.add(nueva_entrada)
        db.session.commit()
        return jsonify(nueva_entrada.serialize()), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al crear entrada: {str(e.orig)}")
        return jsonify({'message': 'Error de integridad en la base de datos al crear la entrada.', 'details': str(e.orig)}), 500
    except ValueError as e: 
        db.session.rollback()
        current_app.logger.error(f"Error de formato de datos al crear entrada: {str(e)}")
        return jsonify({'message': f'Error en el formato de los datos: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error general al crear entrada: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al crear la entrada.'}), 500

@main_bp.route('/admin/entradas', methods=['GET'])
@admin_required
def get_admin_entradas():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        if per_page < 1 or per_page > 100:
            return jsonify({'message': 'El parámetro "per_page" debe estar entre 1 y 100.'}), 400
        query_search = request.args.get('q', '', type=str)
            
        entradas_paginadas = db.paginate(
            entradas_query.order_by(Entrada.fecha_creacion.desc()),
            page=page,
            per_page=per_page,
            error_out=False
        )        
                
        entradas_query = Entrada.query

        if query_search:
            search_term = f"%{query_search}%"
            entradas_query = entradas_query.filter(
                or_( # <--- USO DE or_
                    Entrada.titulo_es.ilike(search_term),
                    Entrada.titulo_en.ilike(search_term),
                    Entrada.titulo_de.ilike(search_term),
                    Entrada.slug.ilike(search_term)
                )
            )

                
        
        
        entradas_items = entradas_paginadas.items
        
        return jsonify({
            'entradas': [entrada.serialize() for entrada in entradas_items],
            'total_pages': entradas_paginadas.pages,
            'current_page': entradas_paginadas.page,
            'total_items': entradas_paginadas.total
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener entradas para admin: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al obtener entradas.'}), 500

@main_bp.route('/admin/entradas/<int:entrada_id>', methods=['GET'])
@admin_required
def get_admin_entrada_by_id(entrada_id):
    try:
        entrada = Entrada.query.get(entrada_id)
        if not entrada:
            return jsonify({'message': 'Entrada no encontrada.'}), 404
        return jsonify(entrada.serialize()), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener entrada {entrada_id} para admin: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al obtener la entrada {entrada_id}.'}), 500

@main_bp.route('/admin/entradas/<int:entrada_id>', methods=['PUT'])
@admin_required
def update_entrada(entrada_id):
    entrada = Entrada.query.get_or_404(entrada_id)
    data = request.get_json()

    if not data:
        return jsonify({'message': 'No se proporcionaron datos JSON.'}), 400

    try:
        if 'titulo_es' in data and data['titulo_es'].strip(): entrada.titulo_es = data['titulo_es'].strip()
        if 'resumen_es' in data and data['resumen_es'].strip(): entrada.resumen_es = data['resumen_es'].strip()
        if 'contenido_es' in data and data['contenido_es'].strip(): entrada.contenido_es = data['contenido_es'].strip()

        for lang_code in ['en', 'de']:
            if f'titulo_{lang_code}' in data: setattr(entrada, f'titulo_{lang_code}', data[f'titulo_{lang_code}'].strip() or None)
            if f'resumen_{lang_code}' in data: setattr(entrada, f'resumen_{lang_code}', data[f'resumen_{lang_code}'].strip() or None)
            if f'contenido_{lang_code}' in data: setattr(entrada, f'contenido_{lang_code}', data[f'contenido_{lang_code}'].strip() or None)
        
        if 'slug' in data and data['slug'].strip():
            nuevo_slug = generar_slug(data['slug'].strip())
            if not nuevo_slug:
                 return jsonify({'message': 'El slug proporcionado es inválido.'}), 400
            if nuevo_slug != entrada.slug and Entrada.query.filter_by(slug=nuevo_slug).first():
                return jsonify({'message': f'El slug "{nuevo_slug}" ya existe.'}), 409
            entrada.slug = nuevo_slug
        elif 'titulo_es' in data and data['titulo_es'].strip() and (not data.get('slug') or not data['slug'].strip()):
            nuevo_slug_por_titulo = generar_slug(data['titulo_es'].strip())
            if not nuevo_slug_por_titulo:
                 return jsonify({'message': 'No se pudo generar un slug válido a partir del título.'}), 400
            if nuevo_slug_por_titulo != entrada.slug and Entrada.query.filter_by(slug=nuevo_slug_por_titulo).first():
                 return jsonify({'message': f'Un slug generado a partir del nuevo título ("{nuevo_slug_por_titulo}") ya existe. Proporcione un slug manualmente.'}), 409
            entrada.slug = nuevo_slug_por_titulo

        if 'autor_id' in data:
            if not Autor.query.get(data['autor_id']):
                return jsonify({'message': f'El autor con id {data["autor_id"]} no existe.'}), 404
            entrada.autor_id = data['autor_id']
        
        if 'categoria_id' in data:
            if not Categoria.query.get(data['categoria_id']):
                return jsonify({'message': f'La categoría con id {data["categoria_id"]} no existe.'}), 404
            entrada.categoria_id = data['categoria_id']

        if 'imagen_destacada' in data: entrada.imagen_destacada = data['imagen_destacada'].strip() or None
        
        if 'estado' in data and data['estado'] in ['borrador', 'publicado']: 
            entrada.estado = data['estado']
            if entrada.estado == 'publicado' and not entrada.fecha_publicacion:
                 entrada.fecha_publicacion = datetime.utcnow()
            elif entrada.estado == 'borrador':
                 entrada.fecha_publicacion = None


        if 'fecha_publicacion' in data:
            fecha_publicacion_str = data.get('fecha_publicacion')
            if fecha_publicacion_str and entrada.estado == 'publicado':
                try:
                    entrada.fecha_publicacion = datetime.fromisoformat(fecha_publicacion_str)
                except ValueError:
                    return jsonify({'message': 'Formato de fecha_publicacion inválido. Usar ISO 8601.'}), 400
            elif not fecha_publicacion_str and entrada.estado == 'publicado': # Si se publica y no se manda fecha, se pone la actual
                 entrada.fecha_publicacion = datetime.utcnow()
            elif entrada.estado == 'borrador': # Si es borrador, se quita la fecha
                 entrada.fecha_publicacion = None
        
        entrada.fecha_actualizacion = datetime.utcnow()
        db.session.commit()
        return jsonify(entrada.serialize()), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de integridad al actualizar entrada {entrada_id}: {str(e.orig)}")
        return jsonify({'message': 'Error de integridad en la base de datos.', 'details': str(e.orig)}), 500
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f"Error de formato de datos al actualizar entrada: {str(e)}")
        return jsonify({'message': f'Error en el formato de los datos: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error general al actualizar entrada {entrada_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al actualizar la entrada {entrada_id}.'}), 500

@main_bp.route('/admin/entradas/<int:entrada_id>', methods=['DELETE'])
@admin_required
def delete_entrada(entrada_id):
    entrada = Entrada.query.get_or_404(entrada_id)
    try:
        db.session.delete(entrada)
        db.session.commit()
        return jsonify({'message': 'Entrada eliminada exitosamente.'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al eliminar entrada {entrada_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al eliminar la entrada {entrada_id}.'}), 500

# --- Endpoints para Mensajes de Contacto (Admin) ---
@main_bp.route('/admin/mensajes_contacto', methods=['GET'])
@admin_required
def get_admin_mensajes_contacto():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        leido_filter = request.args.get('leido', type=str, default=None)

        query = MensajeContacto.query

        if leido_filter is not None:
            if leido_filter.lower() == 'true':
                query = query.filter_by(leido=True)
            elif leido_filter.lower() == 'false':
                query = query.filter_by(leido=False)

        mensajes_paginados = query.order_by(MensajeContacto.fecha_envio.desc()).paginate(page=page, per_page=per_page, error_out=False)
        mensajes_items = mensajes_paginados.items

        return jsonify({
            'mensajes': [{
                'id': msg.id,
                'nombre_remitente': msg.nombre_remitente,
                'email_remitente': msg.email_remitente,
                'asunto': msg.asunto,
                'mensaje': msg.mensaje,
                'fecha_envio': msg.fecha_envio.isoformat() if msg.fecha_envio else None,
                'leido': msg.leido
            } for msg in mensajes_items],
            'total_pages': mensajes_paginados.pages,
            'current_page': mensajes_paginados.page,
            'total_items': mensajes_paginados.total
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener mensajes de contacto para admin: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al obtener mensajes de contacto.'}), 500

@main_bp.route('/admin/mensajes_contacto/<int:mensaje_id>', methods=['GET'])
@admin_required
def get_admin_mensaje_by_id(mensaje_id):
    try:
        mensaje = MensajeContacto.query.get(mensaje_id)
        if not mensaje:
            return jsonify({'message': 'Mensaje de contacto no encontrado.'}), 404
            
        return jsonify({
            'id': mensaje.id,
            'nombre_remitente': mensaje.nombre_remitente,
            'email_remitente': mensaje.email_remitente,
            'asunto': mensaje.asunto,
            'mensaje': mensaje.mensaje,
            'fecha_envio': mensaje.fecha_envio.isoformat() if mensaje.fecha_envio else None,
            'leido': mensaje.leido
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener mensaje de contacto {mensaje_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al obtener el mensaje {mensaje_id}.'}), 500

@main_bp.route('/admin/mensajes_contacto/<int:mensaje_id>/toggle_leido', methods=['PUT'])
@admin_required
def toggle_leido_mensaje_contacto(mensaje_id):
    mensaje = MensajeContacto.query.get_or_404(mensaje_id)
    try:
        mensaje.leido = not mensaje.leido
        db.session.commit()
        return jsonify({
            'message': 'Estado de leído del mensaje actualizado.',
            'leido': mensaje.leido
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al cambiar estado de leído del mensaje {mensaje_id}: {str(e)}")
        return jsonify({'error': 'Error interno del servidor al actualizar el mensaje.'}), 500

@main_bp.route('/admin/mensajes_contacto/<int:mensaje_id>', methods=['DELETE'])
@admin_required
def delete_mensaje_contacto(mensaje_id):
    mensaje = MensajeContacto.query.get_or_404(mensaje_id)
    try:
        db.session.delete(mensaje)
        db.session.commit()
        return jsonify({'message': 'Mensaje de contacto eliminado exitosamente.'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al eliminar mensaje de contacto {mensaje_id}: {str(e)}")
        return jsonify({'error': f'Error interno del servidor al eliminar el mensaje {mensaje_id}.'}), 500