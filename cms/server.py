import os
import json
import secrets
import hmac
import sqlite3
import urllib.request
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from jinja2 import Template

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.environ.get("CMS_MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))

# Paths calculated relative to this file
CMS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(CMS_DIR)
CONTENT_PATH = os.path.join(PROJECT_DIR, "content.json")
TEMPLATE_PATH = os.path.join(PROJECT_DIR, "index.template.html")
OUTPUT_PATH = os.path.join(PROJECT_DIR, "index.html")
ASSETS_DIR = os.path.join(PROJECT_DIR, "assets")
CONFIG_PATH = os.path.join(PROJECT_DIR, "config.json")
ALLOWED_UPLOAD_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get("CMS_ALLOWED_ORIGINS", "http://127.0.0.1:5000,http://localhost:5000").split(",")
    if origin.strip()
}

# Ensure assets folder exists
os.makedirs(ASSETS_DIR, exist_ok=True)

# Session token storage (simple in-memory token)
ACTIVE_TOKEN = secrets.token_hex(16)

def load_config():
    """Loads configuration without creating insecure defaults."""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def check_auth():
    """Validates authorization token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return False
    
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False
        
    return parts[1] == ACTIVE_TOKEN

def compile_page(data):
    """Compiles index.template.html to index.html with content.json data."""
    # Prepare serializations for inline script parameters
    teacher_subtitles = {t['key']: t['subtitles'] for t in data.get('teachers', [])}
    teacher_subtitles_json = json.dumps(teacher_subtitles, ensure_ascii=False)
    
    pricing_data = {r['id']: r['prices'] for r in data.get('rates', [])}
    pricing_json = json.dumps(pricing_data, ensure_ascii=False)
    
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")
        
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_content = f.read()
        
    template = Template(template_content)
    rendered = template.render(
        **data,
        teacher_subtitles_json=teacher_subtitles_json,
        pricing_json=pricing_json
    )
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(rendered)

# CORS headers middleware
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add("Vary", "Origin")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    response.headers.add("X-Content-Type-Options", "nosniff")
    response.headers.add("Referrer-Policy", "same-origin")
    return response

# Handle preflight CORS OPTIONS requests
@app.route("/api/login", methods=["OPTIONS"])
@app.route("/api/content", methods=["OPTIONS"])
@app.route("/api/upload", methods=["OPTIONS"])
def handle_options():
    return jsonify({"status": "ok"}), 200

@app.route("/api/login", methods=["POST"])
def login():
    req_data = request.json or {}
    password = req_data.get("password")
    
    config = load_config()
    correct_password = os.environ.get("CMS_ADMIN_PASSWORD") or config.get("admin_password")
    
    if correct_password and password and hmac.compare_digest(str(password), str(correct_password)):
        return jsonify({
            "status": "success",
            "token": ACTIVE_TOKEN
        }), 200
    
    return jsonify({
        "status": "error",
        "message": "Неверный пароль"
    }), 401

@app.route("/api/content", methods=["GET"])
def get_content():
    if not check_auth():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
    if not os.path.exists(CONTENT_PATH):
        return jsonify({"status": "error", "message": "content.json not found"}), 404
        
    with open(CONTENT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    return jsonify(data), 200

@app.route("/api/content", methods=["POST"])
def save_content():
    if not check_auth():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
    req_data = request.json
    if not req_data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
        
    # Save content.json
    with open(CONTENT_PATH, "w", encoding="utf-8") as f:
        json.dump(req_data, f, ensure_ascii=False, indent=2)
        
    # Recompile index.html
    try:
        compile_page(req_data)
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Ошибка компиляции страницы: {str(e)}"
        }), 500
        
    return jsonify({"status": "success", "message": "Данные успешно сохранены и опубликованы"}), 200

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if not check_auth():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
        
    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        return jsonify({"status": "error", "message": "Unsupported file type"}), 415
    
    # Save file
    file_path = os.path.join(ASSETS_DIR, filename)
    file.save(file_path)
    
    # Return asset path
    relative_path = f"assets/{filename}"
    return jsonify({
        "status": "success",
        "url": relative_path
    }), 200

def init_leads_db():
    """Initializes SQLite database for storing academy leads."""
    db_path = os.path.join(PROJECT_DIR, 'liberty_academy.db')
    conn = sqlite3.connect(db_path)
    conn.execute('''CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL,
        level TEXT,
        date TEXT,
        time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()

@app.route('/api/booking', methods=['POST', 'OPTIONS'])
def save_booking():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    data = request.json
    name = data.get('name', '').strip()
    contact = data.get('contact', '').strip()
    level = data.get('level', '').strip()
    date = data.get('date', '').strip()
    time = data.get('time', '').strip()

    if not name or not contact:
        return jsonify({'error': 'Name and Contact are required.'}), 400

    # Save to SQLite
    db_path = os.path.join(PROJECT_DIR, 'liberty_academy.db')
    conn = sqlite3.connect(db_path)
    conn.execute(
        'INSERT INTO applications (name, contact, level, date, time) VALUES (?, ?, ?, ?, ?)',
        (name, contact, level, date, time)
    )
    conn.commit()
    conn.close()

    # Send Telegram notification
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    if token and chat_id:
        tg_text = (
            f"🔔 *Новая запись на пробный урок!*\n"
            f"🏫 *Сайт:* Liberty English Academy\n"
            f"👤 *Имя:* {name}\n"
            f"📞 *Контакт:* {contact}\n"
            f"📈 *Уровень:* {level}\n"
            f"📅 *Дата:* {date}\n"
            f"⏰ *Время:* {time}"
        )
        url = f'https://api.telegram.org/bot{token}/sendMessage'
        payload = json.dumps({
            'chat_id': chat_id,
            'text': tg_text,
            'parse_mode': 'Markdown'
        }).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                pass
        except Exception as e:
            print(f"Telegram error: {e}")

    return jsonify({'success': True}), 201

if __name__ == "__main__":
    # Initialize leads database
    init_leads_db()
    
    # If starting server directly, load initial content to compile index.html
    try:
        if os.path.exists(CONTENT_PATH):
            with open(CONTENT_PATH, "r", encoding="utf-8") as f:
                initial_data = json.load(f)
            compile_page(initial_data)
            print("Initial page compile successful!")
    except Exception as e:
        print(f"Initial compile failed: {e}")
        
    app.run(
        host=os.environ.get("CMS_HOST", "127.0.0.1"),
        port=int(os.environ.get("CMS_PORT", "5000")),
        debug=os.environ.get("CMS_DEBUG", "0") == "1",
    )

