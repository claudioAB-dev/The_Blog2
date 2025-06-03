# Blog_API/app/commands.py
import click
from flask.cli import with_appcontext
# NO importes current_app aquí para esto, vamos a usar la instancia bcrypt importada.

# Importa 'db' y 'bcrypt' directamente desde .app
# Esto ahora debería funcionar porque se definen antes de la importación de 'commands' en 'app.py'
from .app import db, bcrypt # <--- Usa esta instancia de bcrypt
from .models import Autor

@click.command(name='hash_passwords')
@with_appcontext
def hash_passwords_command():
    """
    Migra las contraseñas en texto plano de la tabla Autor a hashes bcrypt.
    """
    click.echo("Iniciando migración de contraseñas a bcrypt...")
    
    # Ahora usa la instancia 'bcrypt' importada directamente
    # Ya no necesitas current_app.extensions['bcrypt'] para esto.
    
    try:
        autores = Autor.query.all()
        if not autores:
            click.echo("No se encontraron autores en la base de datos.")
            return

        actualizados = 0
        ya_hasheados = 0
        errores = 0

        for autor in autores:
            click.echo(f"Procesando autor ID: {autor.id}, Email: {autor.email}...")
            contrasena_actual = autor.contrasena

            if contrasena_actual and \
               (contrasena_actual.startswith('$2b$') or \
                contrasena_actual.startswith('$2a$') or \
                contrasena_actual.startswith('$2y$')) and \
               len(contrasena_actual) == 60:
                click.echo(f"  La contraseña para el autor ID: {autor.id} parece ya estar hasheada. Omitiendo.")
                ya_hasheados += 1
                continue

            if not contrasena_actual:
                click.echo(f"  El autor ID: {autor.id} no tiene contraseña o está vacía. Omitiendo.")
                continue

            try:
                # Usa la instancia bcrypt importada
                hashed_password = bcrypt.generate_password_hash(contrasena_actual).decode('utf-8')
                autor.contrasena = hashed_password
                actualizados += 1
                click.echo(f"  Contraseña hasheada y actualizada para autor ID: {autor.id}.")
            except Exception as e:
                click.echo(f"  ERROR al hashear la contraseña para el autor ID: {autor.id}. Error: {str(e)}")
                errores += 1
        
        if actualizados > 0:
            try:
                db.session.commit()
                click.secho(f"\n¡Cambios guardados en la base de datos! {actualizados} contraseñas fueron hasheadas.", fg="green")
            except Exception as e:
                db.session.rollback()
                click.secho(f"\nERROR al intentar guardar los cambios en la base de datos: {str(e)}", fg="red")
                click.echo("Se revirtieron los cambios de esta sesión.")
        else:
            click.echo("\nNo se actualizaron nuevas contraseñas (o no se encontraron usuarios para actualizar).")

        click.echo(f"Resumen: {actualizados} actualizadas, {ya_hasheados} ya hasheadas, {errores} errores.")

    except Exception as e:
        click.secho(f"Ocurrió un error general durante el proceso de migración: {str(e)}", fg="red")
        if 'db' in locals() and db.session.is_active:
             db.session.rollback()
             click.echo("Se intentó revertir la sesión de la base de datos debido al error general.")

def register_commands(app): # app aquí no es usada directamente para pasar bcrypt, pero es estándar
    app.cli.add_command(hash_passwords_command)