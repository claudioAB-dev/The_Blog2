from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import current_app 

db = SQLAlchemy()

class Autor(db.Model):
    __tablename__ = 'autor'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False) # Almacenará el hash
    biografia = db.Column(db.Text)
    is_admin = db.Column(db.Boolean, default=False, nullable=False) # Nuevo campo para admin

    entradas = db.relationship('Entrada', backref='autor', lazy=True)

    def set_password(self, password):
        """Hashea y guarda la contraseña."""
        bcrypt = current_app.extensions['bcrypt']
        self.contrasena = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """Verifica la contraseña contra el hash almacenado."""
        bcrypt = current_app.extensions['bcrypt']
        return bcrypt.check_password_hash(self.contrasena, password)

    def __repr__(self):
        return f"<Autor {self.nombre}>"

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'biografia': self.biografia, # Corregido 'Biografía' a 'biografia' para consistencia
            'is_admin': self.is_admin # Opcional: exponer si es admin
        }

class Categoria(db.Model):
    __tablename__ = 'categorias'

    id = db.Column(db.Integer, primary_key=True)
    nombre_es = db.Column(db.String(100), unique=True, nullable=False)
    nombre_en = db.Column(db.String(100), nullable=True)
    nombre_de = db.Column(db.String(100), nullable=True)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    entradas = db.relationship('Entrada', backref='categoria', lazy=True)

    def __repr__(self):
        return f"<Categoria {self.nombre_es} (ID: {self.id})>"

    def serialize(self):
        return {
            'id': self.id,
            'nombre_es': self.nombre_es,
            'nombre_en': self.nombre_en,
            'nombre_de': self.nombre_de,
            'slug': self.slug,
        }

class Comentario(db.Model):
    __tablename__ = 'comentarios'
    id = db.Column(db.Integer, primary_key=True)
    entrada_id = db.Column(db.Integer, db.ForeignKey('entradas.id'), nullable=False)
    nombre_autor = db.Column(db.String(100), nullable=False)
    email_autor = db.Column(db.String(100), nullable=False)
    sitio_web_autor = db.Column(db.String(255))
    contenido = db.Column(db.Text, nullable=False)
    estado = db.Column(db.Enum('PENDIENTE', 'APROBADO', 'SPAM'), default='PENDIENTE', nullable=False)
    comentario_padre_id = db.Column(db.Integer, db.ForeignKey('comentarios.id'))
    fecha_creacion = db.Column(db.TIMESTAMP, default=datetime.utcnow, nullable=False)

    comentarios_hijos = db.relationship('Comentario', remote_side=[id], backref='comentario_padre', lazy=True)

    def __repr__(self):
        return f"<Comentario {self.id}>"

class Entrada(db.Model):
    __tablename__ = 'entradas'
    id = db.Column(db.Integer, primary_key=True)
    autor_id = db.Column(db.Integer, db.ForeignKey('autor.id'), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    titulo_es = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    resumen_es = db.Column(db.Text, nullable=False)
    contenido_es = db.Column(db.Text, nullable=False)
    imagen_destacada = db.Column(db.String(255))
    estado = db.Column(db.Enum('borrador', 'publicado'), default='borrador', nullable=False)
    fecha_publicacion = db.Column(db.TIMESTAMP)
    fecha_creacion = db.Column(db.TIMESTAMP, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = db.Column(db.TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    titulo_en = db.Column(db.String(255), nullable=True) # Permitir nulos si no siempre hay traducción
    titulo_de = db.Column(db.String(255), nullable=True)
    resumen_en = db.Column(db.Text, nullable=True)
    resumen_de = db.Column(db.Text, nullable=True)
    contenido_en = db.Column(db.Text, nullable=True)
    contenido_de = db.Column(db.Text, nullable=True)

    comentarios = db.relationship('Comentario', backref='entrada', lazy=True)
    etiquetas = db.relationship('Etiqueta', secondary='entradas_etiquetas', backref=db.backref('entradas', lazy=True))

    def __repr__(self):
        # Corregido: usar self.titulo_es (o el campo que exista)
        return f"<Entrada {self.titulo_es}>"

    def serialize(self):
        # Corregido: usar los campos correctos (ej. titulo_es en lugar de self.titulo)
        return {
            'id': self.id,
            'autor_id': self.autor_id,
            'categoria_id': self.categoria_id,
            'titulo_es': self.titulo_es, # Ejemplo, podrías querer serializar todos los idiomas
            'slug': self.slug,
            'resumen_es': self.resumen_es,
            'contenido_es': self.contenido_es,
            'imagen_destacada': self.imagen_destacada,
            'estado': self.estado,
            'fecha_publicacion': self.fecha_publicacion.isoformat() if self.fecha_publicacion else None,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
            'titulo_en': self.titulo_en,
            'titulo_de': self.titulo_de,
            'resumen_en': self.resumen_en,
            'resumen_de': self.resumen_de,
            'contenido_en': self.contenido_en,
            'contenido_de': self.contenido_de,
            'comentarios': [comentario.id for comentario in self.comentarios],  
            'etiquetas': [etiqueta.nombre for etiqueta in self.etiquetas]
        }

class EntradaEtiqueta(db.Model):
    __tablename__ = 'entradas_etiquetas'
    entrada_id = db.Column(db.Integer, db.ForeignKey('entradas.id'), primary_key=True)
    etiqueta_id = db.Column(db.Integer, db.ForeignKey('etiquetas.id'), primary_key=True)

    def __repr__(self):
        return f"<EntradaEtiqueta Entrada_id: {self.entrada_id}, Etiqueta_id: {self.etiqueta_id}>"

class Etiqueta(db.Model):
    __tablename__ = 'etiquetas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"<Etiqueta {self.nombre}>"

class MensajeContacto(db.Model):
    __tablename__ = 'mensajes_contacto'
    id = db.Column(db.Integer, primary_key=True)
    nombre_remitente = db.Column(db.String(100), nullable=False)
    email_remitente = db.Column(db.String(100), nullable=False)
    asunto = db.Column(db.String(255))
    mensaje = db.Column(db.Text, nullable=False)
    fecha_envio = db.Column(db.TIMESTAMP, default=datetime.utcnow, nullable=False)
    leido = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<MensajeContacto {self.asunto}>"