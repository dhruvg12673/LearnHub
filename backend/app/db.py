import sqlite3
from contextlib import contextmanager

DB_NAME = "edtech.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Roadmaps Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS roadmaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            language TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            roadmap_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Node Content Table (Cache)
    c.execute('''
        CREATE TABLE IF NOT EXISTS node_content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roadmap_id INTEGER NOT NULL,
            node_label TEXT NOT NULL,
            mode TEXT NOT NULL,
            content_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (roadmap_id) REFERENCES roadmaps (id),
            UNIQUE(roadmap_id, node_label, mode)
        )
    ''')

    # Quiz Attempts Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            roadmap_id INTEGER NOT NULL,
            node_label TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            time_taken_seconds INTEGER NOT NULL,
            attempt_data_json TEXT NOT NULL, -- Stores questions, user answers, time per question
            review_text TEXT, -- AI generated review
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (roadmap_id) REFERENCES roadmaps (id)
        )
    ''')

    # Migration for existing table
    try:
        c.execute("ALTER TABLE quiz_attempts ADD COLUMN review_text TEXT")
    except sqlite3.OperationalError:
        pass # Column likely already exists

    # User Knowledge Table (Digital Twin Memory)
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_knowledge (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            subtopic TEXT NOT NULL,
            mastery_score INTEGER DEFAULT 0, -- 0 to 100
            status TEXT DEFAULT 'novice', -- novice, competent, expert
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, topic, subtopic)
        )
    ''')
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
