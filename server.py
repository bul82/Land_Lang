import os
import sqlite3
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

DATABASE = 'liberty_academy.db'

# Функция для подключения к базе данных
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Создание таблицы для заявок
def init_db():
    with get_db_connection() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL
        )''')
        conn.commit()

# Отправка уведомления в Telegram
def send_telegram_message(text):
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {'chat_id': chat_id, 'text': text}
    requests.post(url, data=payload)

@app.route('/apply', methods=['POST'])
def apply():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'Все поля обязательны для заполнения.'}), 400

    with get_db_connection() as conn:
        conn.execute('INSERT INTO applications (name, email, message) VALUES (?, ?, ?)', (name, email, message))
        conn.commit()

    send_telegram_message(f'Новая заявка: {name}, {email}, {message}')
    return jsonify({'success': 'Заявка успешно отправлена.'}), 201

if __name__ == '__main__':
    init_db()
    app.run(debug=True)