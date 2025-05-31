from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pymysql
db = SQLAlchemy()

class Autor(db.Model):
    __tablename__ = 'autor'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    contrasena = db.Column(db.String(255), nullable=False)
    biografia = db.Column(db.Text)

    entradas = db.relationship('Entrada', backref='autor', lazy=True)

    def __repr__(self):
        return f"<Autor {self.nombre}>"
    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'Biografía': self.biografia
            # agrega aquí otros campos que quieras exponer
        }

class Categoria(db.Model):
    __tablename__ = 'categorias'

    id = db.Column(db.Integer, primary_key=True)

    # Nuevos campos para nombres en varios idiomas
    nombre_es = db.Column(db.String(100), unique=True, nullable=False)  # Español, primario y obligatorio
    nombre_en = db.Column(db.String(100), nullable=True)                # Inglés, opcional
    nombre_de = db.Column(db.String(100), nullable=True)                # Alemán, opcional

    # El slug sigue siendo único y obligatorio. Deberás ajustar la lógica de generación
    # en tus rutas para que use, por ejemplo, nombre_es.
    slug = db.Column(db.String(100), unique=True, nullable=False)


    # Relación con Entradas (sin cambios)
    entradas = db.relationship('Entrada', backref='categoria', lazy=True)

    def __repr__(self):
        # Actualizado para usar el nombre en español como representación principal
        return f"<Categoria {self.nombre_es} (ID: {self.id})>"

    def serialize(self):
        # Actualizado para incluir los nuevos campos de nombre
        return {
            'id': self.id,
            'nombre_es': self.nombre_es,
            'nombre_en': self.nombre_en,
            'nombre_de': self.nombre_de,
            'slug': self.slug,
            # Puedes añadir más información si es necesario, por ejemplo:
            # 'entradas_ids': [entrada.id for entrada in self.entradas]
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
    titulo_en = db.Column(db.String(255), nullable=False)
    titulo_de = db.Column(db.String(255), nullable=False)
    resumen_en = db.Column(db.Text, nullable=False)
    resumen_de = db.Column(db.Text, nullable=False)
    contenido_en = db.Column(db.Text, nullable=False)
    contenido_de = db.Column(db.Text, nullable=False)
  


    comentarios = db.relationship('Comentario', backref='entrada', lazy=True)
    etiquetas = db.relationship('Etiqueta', secondary='entradas_etiquetas', backref=db.backref('entradas', lazy=True))

    def __repr__(self):
        return f"<Entrada {self.titulo}>"
    def serialize(self):
        return {
            'id': self.id,
            'autor_id': self.autor_id,
            'categoria_id': self.categoria_id,
            'titulo': self.titulo,
            'slug': self.slug,
            'resumen': self.resumen,
            'contenido': self.contenido,
            'imagen_destacada': self.imagen_destacada,
            'estado': self.estado,
            'fecha_pulicacion': self.fecha_publicacion,
            'fecha_creacion': self.fecha_creacion,
            'fecha_actualizacion': self.fecha_actualizacion,
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