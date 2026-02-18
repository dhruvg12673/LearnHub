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
            topics TEXT NOT NULL,
            language TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            interest TEXT,
            objective TEXT,
            roadmap_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Migration for existing databases
    try:
        c.execute("ALTER TABLE roadmaps ADD COLUMN interest TEXT")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE roadmaps ADD COLUMN objective TEXT")
    except sqlite3.OperationalError:
        pass

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

    # Coding Sessions
    c.execute('''
        CREATE TABLE IF NOT EXISTS coding_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            language TEXT NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Coding Messages
    c.execute('''
        CREATE TABLE IF NOT EXISTS coding_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES coding_sessions (id)
        )
    ''')

    # Resources Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL, 
            category TEXT,
            file_path TEXT,
            filename TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Tutor Sessions
    c.execute('''
        CREATE TABLE IF NOT EXISTS tutor_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            topic TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, topic)
        )
    ''')

    # Tutor Messages
    c.execute('''
        CREATE TABLE IF NOT EXISTS tutor_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES tutor_sessions (id)
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
