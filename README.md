# The Blog V2 - Full-Stack Blog System 🚀

"The Blog V2" is a complete and modern blog application, designed to be multilingual and offer a seamless experience for both readers and administrators. It consists of an interactive frontend built with React and TypeScript, and a robust backend API developed with Flask (Python).

![Blog main view](images/img1.png)
*Screenshot of the blog's main page.*

## ✨ Main Features

The system is divided into a dynamic frontend and a powerful backend, offering a wide range of functionalities:

### Frontend (React + TypeScript)
* **Modern and Reactive Interface:** Built with React, TypeScript, and Vite for a fast and efficient user experience.
* **Internationalization (i18n):** Full support for multiple languages (Spanish, English, German) in both the user interface and blog content.
* **Post Display:**
    * Main page with the latest posts and a featured post.
    * Detailed view for each blog article.
    * Post filtering by category for easy navigation.
        ![Posts by category](images/img4.png)
        *Filtering posts by category (e.g., Artificial Intelligence).*
* **Contact Form:** Allows users to send messages directly.
    ![Contact Form](images/img3.png)
    *Contact form modal.*

### Backend (Flask API)
* **Robust RESTful API:** Developed with Flask to serve and manage all blog data.
* **ORM with SQLAlchemy:** Object-relational mapping for efficient database interaction.
* **Security:** Password hashing for author account protection.
* **Friendly URLs:** Automatic slug generation for blog posts.

### Admin Panel
* **Secure Authentication:** Login system using JSON Web Tokens (JWT).
* **Full CRUD Management:**
    * **Authors:** Create, read, update, and delete authors, with role distinction (administrator/non-administrator).
    * **Categories:** Comprehensive management of blog categories, with multilingual support.
    * **Blog Posts:** Total management of posts (create, read, update, delete), including multilingual support, author and category assignment, and status handling (draft/published).
* **Message Management:** View and manage received contact messages.
* **Advanced Features:** Pagination and post search for efficient management in the admin panel.

## 🛠️ Technologies Used

<table width="100%">
<tr>
<td width="50%" valign="top">

**Frontend:**
* React 19
* TypeScript
* Vite
* React Router DOM (v6+ for routing)
* Material UI Icons (for iconography)
* CSS (for custom styles)

</td>
<td width="50%" valign="top">

**Backend (API):**
* Python 3.x
* Flask
* Flask-SQLAlchemy (ORM)
* Flask-CORS (Cross-Origin Resource Sharing Management)
* Flask-Bcrypt (Password Hashing)
* Flask-JWT-Extended (Authentication with JSON Web Tokens)
* python-dotenv (Environment variable management)
* PyMySQL (MySQL Driver)
* Gunicorn (WSGI server for production)

</td>
</tr>
</table>

## 📂 Project Structure

The repository is organized into two main directories to separate the frontend from the backend:

* `the_blog2/`: Contains the frontend source code in React.
    * `public/`: Static files.
    * `src/`: Source code of the React application.
        * `components/`: Reusable UI components.
            * `admin/`: Components specific to the admin panel.
            * `style/`: CSS files for components.
        * `context/`: React contexts (e.g., `AuthContext`).
        * `features/`: Specific functionalities (e.g., `LanguageContext`).
        * `pages/`: Components representing application pages.
        * `services/`: Logic for interacting with the API.
        * `App.tsx`: Main route configuration.
        * `main.tsx`: Entry point of the React application.
* `Blog_API/`: Contains the backend API source code in Flask.
    * `app/`: Main module of the Flask application.
        * `__init__.py` or `app.py`: Flask application factory and extension configuration.
        * `models.py`: Database model definitions (SQLAlchemy).
        * `routes.py`: API endpoint definitions.
        * `schemas.py` (Optional, if using Marshmallow/Pydantic): Schema definitions for validation and serialization.
        * `utils.py` (Optional): Utility functions.
    * `migrations/` (If using Flask-Migrate): Database migration scripts.
    * `run.py`: Script to start the Flask development server.
    * `config.py`: Application configurations.
    * `.env`: File for environment variables (do not version if it contains secrets).
    * `requirements.txt`: Python dependencies.

## 🚀 Setup and Execution

Ensure you have Node.js, npm (or yarn), Python, and pip installed on your system.

### Backend (Flask API)

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd <your-repository-url>
    ```

2.  **Navigate to the `Blog_API/` directory:**
    ```bash
    cd Blog_API/
    ```

3.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows:
    # venv\Scripts\activate
    ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure environment variables:**
    Create a `.env` file in the root of the `Blog_API/` directory with the following content (adjust the values according to your configuration):
    ```env
    FLASK_APP=app:create_app # Or your script name and factory function
    FLASK_ENV=development # development or production
    FLASK_DEBUG=True # Or False for production
    DATABASE_URI="mysql+pymysql://your_user:your_password@your_host/your_database_name"
    JWT_SECRET_KEY="your_super_secret_and_long_key_for_jwt"
    FLASK_RUN_PORT=5000
    # FRONTEND_URL="http://localhost:5173" # Frontend URL for CORS
    ```
    Make sure to replace the placeholders with your MySQL database configuration and a secure JWT secret key.

6.  **Create database tables:**
    * **Option 1 (Recommended if using Flask-Migrate):**
        ```bash
        # (You need to have Flask-Migrate configured in your app)
        # flask db init  # Only the first time
        # flask db migrate -m "Initial migration"
        # flask db upgrade
        ```
    * **Option 2 (Direct creation - if not using Flask-Migrate):**
        If you don't have Flask-Migrate, you'll need a script or a way to run `db.create_all()` within the Flask application context. This is often done by adding a command to `run.py` or through the Flask shell:
        ```python
        # In your `app.py` or a shell context:
        # from app import create_app, db
        # app = create_app()
        # with app.app_context():
        #     db.create_all()
        ```
        *Note: The original README indicated that table creation was not explicitly defined initially. It is crucial to implement one of these methods.*

7.  **Run the API:**
    ```bash
    flask run
    # Or if you use `run.py` configured with Gunicorn or similar:
    # python run.py
    ```
    The API will be available at `http://127.0.0.1:5000` (or the port configured in `.env`).

### Frontend (React App)

1.  **Navigate to the `the_blog2/` directory** (from the project root):
    ```bash
    cd ../the_blog2/ # Or the correct path if you are in Blog_API/
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or if using yarn:
    # yarn install
    ```

3.  **Configure environment variables (if necessary):**
    Create a `.env.local` file in the root of `the_blog2/` if you need to configure the API URL for the frontend:
    ```env
    VITE_API_BASE_URL=[http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)
    ```
    Make sure your React components use `import.meta.env.VITE_API_BASE_URL` to access this variable.

4.  **Run the development application:**
    ```bash
    npm run dev
    # or if using yarn:
    # yarn dev
    ```
    The React application will generally be available at `http://localhost:5173` (Vite might use another port if 5173 is busy, check the console output).

## 🔑 Admin Panel

* The admin panel is accessible via the `/login` route in the frontend to log in.
* Once authenticated as an administrator, protected routes under `/admin` can be accessed to manage blog content.
* **Important - Creating the First Administrator:** The first administrator user must be created directly in the database or via a specific script/endpoint (if developed for this purpose). Ensure that the `is_admin` field (or similar) is `True` (or `1`) for that user in the authors/users table.

## 🌍 Internationalization (i18n)

* **Frontend:** Uses `LanguageContext` to manage the current interface language (ES, EN, DE). Components and textual data are rendered in the language selected by the user.
* **Backend:** Data models (like posts and categories) store relevant text fields (titles, summaries, content, category names) in the three supported languages, allowing the API to serve appropriate content as required.

## 📡 Main API Endpoints (Examples)

The RESTful API exposes several endpoints for interacting with the blog. Here are some examples:

* `GET /api/entradas`: Gets all published posts (for readers).
* `GET /api/entradas?slug={slug}`: Gets a specific post by its slug.
* `GET /api/categorias`: Gets all categories.
* `POST /api/login`: Authenticates an author and returns a JWT token.
* `POST /api/mensajecontacto`: Creates a new contact message.
* `GET /api/admin/entradas`: (Requires admin authentication) Gets all posts for management, with pagination and search options.
* `POST /api/admin/entradas`: (Requires admin authentication) Creates a new blog post.
* `PUT /api/admin/entradas/{id}`: (Requires admin authentication) Updates an existing post.
* `DELETE /api/admin/entradas/{id}`: (Requires admin authentication) Deletes a post.

For a complete and detailed list of endpoints, refer to the `Blog_API/app/routes.py` file.

---

This README provides an overview of "The Blog V2" project, its key features, and how to get it up and running. We hope you enjoy developing and using it!
