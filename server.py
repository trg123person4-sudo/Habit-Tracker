#!/usr/bin/env python3
"""
NudgePoint Unified Server: HTTP Asset Serving + Real-Time WebSocket Pub/Sub + SQLite Persistence
"""

import sys
import os
import json
import time
import re
import sqlite3
import argparse
import asyncio
import threading
import hashlib
import secrets
import hmac
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import websockets

# Default Configuration
DEFAULT_HTTP_PORT = 8080
DEFAULT_WS_PORT = 8765
DEFAULT_HOST = "127.0.0.1"
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nudgepoint.db")

# Active WebSocket Hub Reference (initialized at startup)
ws_hub = None

# Basic Profanity / Abuse Filter
PROFANITY_PATTERN = re.compile(
    r"\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|nigger|nigga|faggot|retard|kill\s+yourself)\b",
    re.IGNORECASE
)

# ---------------------------------------------------------------------------
# 1. CRYPTOGRAPHIC PRIMITIVES & USER AUTHENTICATION
# ---------------------------------------------------------------------------
def hash_password(password: str) -> tuple:
    """Hash password using PBKDF2-HMAC-SHA256 with 200,000 iterations and random 16-byte salt."""
    salt = secrets.token_bytes(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200000)
    return pw_hash.hex(), salt.hex()

def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
    """Verify password against stored PBKDF2 hash using constant-time comparison."""
    try:
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
        derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200000)
        return hmac.compare_digest(expected, derived)
    except Exception:
        return False

# ---------------------------------------------------------------------------
# 2. DATABASE PERSISTENCE & SCHEMAS (SQLite)
# ---------------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            teacher_pin TEXT NOT NULL,
            teacher_id TEXT,
            active_topic TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS room_enrollments (
            room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            enrolled_at INTEGER NOT NULL,
            PRIMARY KEY (room_id, student_id)
        );

        CREATE TABLE IF NOT EXISTS pulses (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            student_ip TEXT,
            tag TEXT NOT NULL,
            topic TEXT,
            timestamp INTEGER NOT NULL,
            resolved INTEGER DEFAULT 0,
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            text TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            projected INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        );

        CREATE TABLE IF NOT EXISTS interventions (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            title TEXT NOT NULL,
            topic TEXT,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id)
        );

        CREATE INDEX IF NOT EXISTS idx_pulses_room_time ON pulses(room_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_questions_room ON questions(room_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """)
        
        cur = conn.cursor()
        # Safe migration: ensure teacher_id column exists in rooms
        cur.execute("PRAGMA table_info(rooms)")
        columns = [row[1] for row in cur.fetchall()]
        if "teacher_id" not in columns:
            cur.execute("ALTER TABLE rooms ADD COLUMN teacher_id TEXT REFERENCES users(id)")

        # Seed default teacher account
        cur.execute("SELECT id FROM users WHERE email = 'prof.euler@nudgepoint.edu'")
        if not cur.fetchone():
            pw_hash, salt = hash_password("PodiumPass123!")
            cur.execute(
                "INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("u_tch_euler", "prof.euler@nudgepoint.edu", pw_hash, salt, "Prof. Leonhard Euler", "teacher", int(time.time() * 1000))
            )

        # Seed default student account
        cur.execute("SELECT id FROM users WHERE email = 'alex.rivera@nudgepoint.edu'")
        if not cur.fetchone():
            pw_hash, salt = hash_password("StudentPass123!")
            cur.execute(
                "INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("u_stu_alex", "alex.rivera@nudgepoint.edu", pw_hash, salt, "Alex Rivera", "student", int(time.time() * 1000))
            )

        # Seed default room CALC if it does not exist
        cur.execute("SELECT id, teacher_id FROM rooms WHERE id = 'CALC'")
        calc_row = cur.fetchone()
        if not calc_row:
            cur.execute(
                "INSERT INTO rooms (id, name, teacher_pin, teacher_id, active_topic, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                ("CALC", "MATH 201: Multivariable Calculus", "8492", "u_tch_euler", "3. Step 3: Algebraic Conjugate Substitution", int(time.time() * 1000))
            )
            # Insert baseline seed question
            cur.execute(
                "INSERT INTO questions (id, room_id, student_id, text, upvotes, projected, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("q_seed_1", "CALC", "u_tch_euler", "Where did the common denominator (x+h) cancel out?", 8, 1, int(time.time() * 1000) - 120000)
            )
        elif not calc_row["teacher_id"]:
            cur.execute("UPDATE rooms SET teacher_id = 'u_tch_euler' WHERE id = 'CALC'")

        # Ensure student enrollment in CALC
        cur.execute(
            "INSERT OR IGNORE INTO room_enrollments (room_id, student_id, enrolled_at) VALUES (?, ?, ?)",
            ("CALC", "u_stu_alex", int(time.time() * 1000))
        )
    conn.close()

# ---------------------------------------------------------------------------
# 3. USER MANAGEMENT & SESSION HELPERS
# ---------------------------------------------------------------------------
def db_create_user(email: str, password: str, full_name: str, role: str = "student") -> dict:
    email = email.strip().lower()
    role = role.strip().lower()
    if role not in ("student", "teacher"):
        raise ValueError("Invalid role. Must be 'student' or 'teacher'.")
    if not email or "@" not in email:
        raise ValueError("Invalid email address.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")
    if not full_name.strip():
        raise ValueError("Full name is required.")

    user_id = f"u_{'tch' if role == 'teacher' else 'stu'}_{secrets.token_hex(6)}"
    pw_hash, salt = hash_password(password)
    now_ms = int(time.time() * 1000)

    conn = get_db()
    try:
        with conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, email, pw_hash, salt, full_name.strip(), role, now_ms)
            )
    except sqlite3.IntegrityError:
        conn.close()
        raise ValueError("An account with this email already exists.")
    conn.close()
    return {"id": user_id, "email": email, "full_name": full_name.strip(), "role": role}

def db_authenticate_user(email: str, password: str) -> dict:
    email = email.strip().lower()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()
    if not user:
        return None
    if not verify_password(password, user["password_hash"], user["salt"]):
        return None
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"]}

def db_create_session(user_id: str, role: str, ttl_days: int = 7) -> str:
    token = secrets.token_urlsafe(32)
    now = int(time.time())
    expires_at = now + (ttl_days * 86400)
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT INTO user_sessions (token, user_id, role, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
            (token, user_id, role, now, expires_at)
        )
    conn.close()
    return token

def db_get_user_from_token(token: str) -> dict:
    if not token:
        return None
    now = int(time.time())
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.full_name, u.role, s.expires_at
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ?
    """, (token, now))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["id"], "email": row["email"], "full_name": row["full_name"], "role": row["role"]}

def db_revoke_session(token: str) -> bool:
    if not token:
        return False
    conn = get_db()
    with conn:
        cur = conn.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
        deleted = cur.rowcount > 0
    conn.close()
    return deleted

def db_enroll_student(room_id: str, student_id: str):
    now_ms = int(time.time() * 1000)
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO room_enrollments (room_id, student_id, enrolled_at) VALUES (?, ?, ?)",
            (room_id, student_id, now_ms)
        )
    conn.close()

def db_get_student_room_state(room_id: str, student_id: str) -> dict:
    """Return student-safe state: only the student's own active pulse, never peers'."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, active_topic FROM rooms WHERE id = ?", (room_id,))
    room = cur.fetchone()
    if not room:
        conn.close()
        return None

    # Retrieve only THIS student's active pulse (if any) within last 90 seconds
    cutoff = int(time.time() * 1000) - 90000
    cur.execute(
        "SELECT id, timestamp, tag, topic, resolved FROM pulses WHERE room_id = ? AND student_id = ? AND timestamp >= ? AND resolved = 0 ORDER BY timestamp DESC LIMIT 1",
        (room_id, student_id, cutoff)
    )
    my_pulse_row = cur.fetchone()
    my_pulse = dict(my_pulse_row) if my_pulse_row else None

    # Retrieve questions (without exposing other students' private tokens or IPs)
    cur.execute(
        "SELECT id, text, upvotes, projected, created_at as timestamp FROM questions WHERE room_id = ? ORDER BY upvotes DESC, created_at ASC",
        (room_id,)
    )
    questions = [dict(row) for row in cur.fetchall()]

    conn.close()
    return {
        "room": room_id,
        "name": room["name"],
        "activeTopic": room["active_topic"],
        "myPulse": my_pulse,
        "questions": questions
    }

def db_get_room_state(room_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM rooms WHERE id = ?", (room_id,))
    room = cur.fetchone()
    if not room:
        conn.close()
        return None

    # Retrieve active pulses (within last 90 seconds)
    cutoff = int(time.time() * 1000) - 90000
    cur.execute(
        "SELECT id, student_id as studentId, timestamp, tag, topic FROM pulses WHERE room_id = ? AND timestamp >= ? AND resolved = 0 ORDER BY timestamp ASC",
        (room_id, cutoff)
    )
    pulses = [dict(row) for row in cur.fetchall()]

    # Retrieve all open questions
    cur.execute(
        "SELECT id, text, upvotes, projected, created_at as timestamp FROM questions WHERE room_id = ? ORDER BY upvotes DESC, created_at ASC",
        (room_id,)
    )
    questions = [dict(row) for row in cur.fetchall()]

    # Retrieve interventions
    cur.execute(
        "SELECT id, title, topic, timestamp FROM interventions WHERE room_id = ? ORDER BY timestamp DESC LIMIT 20",
        (room_id,)
    )
    interventions = [dict(row) for row in cur.fetchall()]

    conn.close()
    return {
        "room": room_id,
        "name": room["name"],
        "activeTopic": room["active_topic"],
        "pulses": pulses,
        "questions": questions,
        "interventions": interventions,
    }

def db_save_pulse(pulse_data, ip):
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO pulses (id, room_id, student_id, student_ip, tag, topic, timestamp, resolved) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
            (pulse_data["id"], pulse_data["room"], pulse_data["studentId"], ip, pulse_data.get("tag", "step"), pulse_data.get("topic", ""), pulse_data["timestamp"])
        )
    conn.close()

def db_resolve_pulse(room_id, student_id):
    conn = get_db()
    with conn:
        conn.execute(
            "UPDATE pulses SET resolved = 1 WHERE room_id = ? AND student_id = ? AND resolved = 0",
            (room_id, student_id)
        )
    conn.close()

def db_save_question(q_data):
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO questions (id, room_id, student_id, text, upvotes, projected, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (q_data["id"], q_data["room"], q_data.get("studentId", "anon"), q_data["text"], q_data.get("upvotes", 0), 1 if q_data.get("projected") else 0, q_data["timestamp"])
        )
    conn.close()

def db_upvote_question(q_id):
    conn = get_db()
    with conn:
        conn.execute("UPDATE questions SET upvotes = upvotes + 1 WHERE id = ?", (q_id,))
    conn.close()

def db_project_question(q_id, projected):
    conn = get_db()
    with conn:
        conn.execute("UPDATE questions SET projected = ? WHERE id = ?", (1 if projected else 0, q_id))
    conn.close()

def db_save_topic(room_id, topic):
    conn = get_db()
    with conn:
        conn.execute("UPDATE rooms SET active_topic = ? WHERE id = ?", (topic, room_id))
    conn.close()

def db_save_intervention(i_data):
    conn = get_db()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO interventions (id, room_id, title, topic, timestamp) VALUES (?, ?, ?, ?, ?)",
            (i_data["id"], i_data["room"], i_data["title"], i_data.get("topic", ""), i_data["timestamp"])
        )
    conn.close()

def db_get_historical_analytics(room_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM pulses WHERE room_id = ? ORDER BY timestamp ASC", (room_id,))
    all_pulses = [dict(row) for row in cur.fetchall()]
    
    cur.execute("SELECT * FROM interventions WHERE room_id = ? ORDER BY timestamp ASC", (room_id,))
    interventions = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    tag_counts = {}
    topic_counts = {}
    for p in all_pulses:
        tag = p["tag"]
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        topic = p["topic"] or "General"
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
    hardest_topic = max(topic_counts, key=topic_counts.get) if topic_counts else "None"
    dominant_factor = max(tag_counts, key=tag_counts.get) if tag_counts else "step"
    
    return {
        "room": room_id,
        "totalPulses": len(all_pulses),
        "totalInterventions": len(interventions),
        "hardestTopic": hardest_topic,
        "dominantFactor": dominant_factor,
        "tagDistribution": tag_counts,
        "interventions": interventions
    }

# ---------------------------------------------------------------------------
# 2. HTTP STATIC FILE SERVER WITH REST API
# ---------------------------------------------------------------------------
class NudgePointHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

    def send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def send_error_json(self, status_code: int, message: str):
        self.send_json(status_code, {"error": message, "statusCode": status_code})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def get_bearer_token(self) -> str:
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        if "?" in self.path:
            query = self.path.split("?", 1)[1]
            for param in query.split("&"):
                if param.startswith("token="):
                    return param.split("=", 1)[1].strip()
        return None

    def get_current_user(self) -> dict:
        token = self.get_bearer_token()
        if not token:
            return None
        return db_get_user_from_token(token)

    def require_auth(self, allowed_roles=None) -> dict:
        user = self.get_current_user()
        if not user:
            self.send_error_json(401, "Authentication required. Please log in.")
            return None
        if allowed_roles and user["role"] not in allowed_roles:
            self.send_error_json(403, f"Access denied. Requires role: {', '.join(allowed_roles)}")
            return None
        return user

    def require_room_teacher(self, room_id: str):
        user = self.require_auth(allowed_roles=["teacher"])
        if not user:
            return None, None
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM rooms WHERE id = ?", (room_id,))
        room = cur.fetchone()
        conn.close()
        if not room:
            self.send_error_json(404, f"Lecture room '{room_id}' not found.")
            return None, None
        if room["teacher_id"] and room["teacher_id"] != user["id"]:
            self.send_error_json(403, "Access denied. You do not own this lecture room.")
            return None, None
        return user, dict(room)

    def do_GET(self):
        clean_path = self.path.split("?")[0]

        # 1. Health check (Public)
        if clean_path == "/api/health":
            rooms_count = len(ws_hub.rooms) if ws_hub else 0
            active_clients = len(ws_hub.client_meta) if ws_hub else 0
            self.send_json(200, {
                "status": "ok",
                "time": int(time.time()),
                "rooms": rooms_count,
                "activeClients": active_clients
            })
            return

        # 2. Authenticated Profile check
        if clean_path == "/api/auth/me":
            user = self.require_auth()
            if user:
                self.send_json(200, {"user": user})
            return

        # 3. Student-Scoped State (Student only, never exposes other students' pulses)
        if clean_path.startswith("/api/rooms/") and clean_path.endswith("/student-state"):
            parts = clean_path.split("/")
            room_id = parts[3].upper() if len(parts) >= 5 else "CALC"
            user = self.require_auth(allowed_roles=["student"])
            if not user:
                return
            db_enroll_student(room_id, user["id"])
            data = db_get_student_room_state(room_id, user["id"])
            if not data:
                self.send_error_json(404, f"Lecture room '{room_id}' not found.")
                return
            data["student"] = {"id": user["id"], "name": user["full_name"], "role": "student"}
            self.send_json(200, data)
            return

        # 4. Teacher Historical Analytics (Teacher owner ONLY)
        if clean_path.startswith("/api/sessions/") and clean_path.endswith("/analytics"):
            parts = clean_path.split("/")
            room_id = parts[3].upper() if len(parts) >= 5 else "CALC"
            user, room = self.require_room_teacher(room_id)
            if not user:
                return
            data = db_get_historical_analytics(room_id)
            self.send_json(200, data)
            return

        # 5. Teacher Live Room State (Teacher owner ONLY)
        if clean_path.startswith("/api/rooms/") and clean_path.endswith("/state"):
            parts = clean_path.split("/")
            room_id = parts[3].upper() if len(parts) >= 5 else "CALC"
            user, room = self.require_room_teacher(room_id)
            if not user:
                return
            data = db_get_room_state(room_id)
            if not data:
                self.send_error_json(404, f"Lecture room '{room_id}' not found.")
                return
            self.send_json(200, data)
            return

        # Deny access to sensitive or system files
        lower_path = self.path.lower()
        if lower_path.startswith("/.git") or lower_path.endswith(".db") or lower_path.endswith(".bat"):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden")
            return

        # Rewrite SPA paths to index.html
        if clean_path in ("/login", "/login/teacher", "/login/student", "/timings", "/syllabus", "/student"):
            self.path = "/index.html"
            return super().do_GET()

        # Standard static file delivery
        super().do_GET()

    def do_POST(self):
        clean_path = self.path.split("?")[0]
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        # 1. User Signup
        if clean_path == "/api/auth/signup":
            email = payload.get("email", "")
            password = payload.get("password", "")
            full_name = payload.get("fullName", "")
            role = payload.get("role", "student")
            try:
                user = db_create_user(email, password, full_name, role)
                token = db_create_session(user["id"], user["role"])
                self.send_json(201, {"token": token, "user": user})
            except ValueError as e:
                self.send_error_json(400, str(e))
            return

        # 2. User Login
        if clean_path == "/api/auth/login":
            email = payload.get("email", "")
            password = payload.get("password", "")
            expected_role = payload.get("expectedRole") or payload.get("role")

            user = db_authenticate_user(email, password)
            if not user:
                self.send_error_json(401, "Invalid email or password.")
                return

            if expected_role and user["role"] != expected_role:
                if expected_role == "teacher":
                    self.send_error_json(403, "This account is registered as a Student. Please use the Student login portal.")
                elif expected_role == "student":
                    self.send_error_json(403, "This account is registered as an Instructor. Please use the Teacher login portal.")
                else:
                    self.send_error_json(403, f"Access denied. Account is registered as {user['role']}.")
                return

            token = db_create_session(user["id"], user["role"])
            self.send_json(200, {"token": token, "user": user})
            return

        # 3. User Logout
        if clean_path == "/api/auth/logout":
            token = self.get_bearer_token()
            if token:
                db_revoke_session(token)
            self.send_json(200, {"success": True})
            return

        # 4. Verify PIN (Legacy teacher PIN fallback, also creates authenticated session)
        if clean_path == "/api/rooms/verify-pin":
            room_id = payload.get("room", "CALC").upper()
            pin = str(payload.get("pin", "")).strip()
            conn = get_db()
            cur = conn.cursor()
            cur.execute("SELECT teacher_pin, teacher_id FROM rooms WHERE id = ?", (room_id,))
            row = cur.fetchone()
            conn.close()

            valid = bool(row and row["teacher_pin"] == pin)
            token = None
            user = None
            if valid and row["teacher_id"]:
                conn = get_db()
                cur = conn.cursor()
                cur.execute("SELECT id, email, full_name, role FROM users WHERE id = ?", (row["teacher_id"],))
                u_row = cur.fetchone()
                conn.close()
                if u_row:
                    user = dict(u_row)
                    token = db_create_session(user["id"], user["role"])
            self.send_json(200, {"success": valid, "token": token, "user": user})
            return

        self.send_error_json(404, "Endpoint not found.")

    def end_headers(self):
        # Security Headers
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        super().end_headers()

    def log_message(self, format, *args):
        # Quiet log for health checks
        try:
            formatted = format % args
            if "/api/health" in formatted:
                return
        except Exception:
            pass
        super().log_message(format, *args)

# ---------------------------------------------------------------------------
# 3. WEBSOCKET PUB/SUB SERVER (150+ Concurrent Scale)
# ---------------------------------------------------------------------------
class WebSocketHub:
    def __init__(self):
        # room_code -> set of websocket connections
        self.rooms = {}
        self.client_meta = {} # websocket -> { room, role, studentId, ip }
        self.pulse_cooldowns = {} # (room, studentId/ip) -> last_pulse_ts
        self.question_cooldowns = {} # (room, studentId/ip) -> last_question_ts

    async def broadcast(self, room_id, message_dict, exclude=None):
        if room_id not in self.rooms:
            return
        payload = json.dumps(message_dict)
        dead = []
        for ws in list(self.rooms[room_id]):
            if ws == exclude:
                continue
            try:
                await ws.send(payload)
            except websockets.exceptions.ConnectionClosed:
                dead.append(ws)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove_client(ws)

    def remove_client(self, ws):
        meta = self.client_meta.pop(ws, None)
        if meta:
            room = meta["room"]
            if room in self.rooms and ws in self.rooms[room]:
                self.rooms[room].remove(ws)

    async def handle_client(self, websocket):
        client_ip = websocket.remote_address[0] if websocket.remote_address else "127.0.0.1"
        try:
            async for raw_msg in websocket:
                try:
                    data = json.loads(raw_msg)
                except Exception:
                    continue

                msg_type = data.get("type")
                room_id = (data.get("room") or "CALC").upper()

                # --- 1. JOIN ---
                if msg_type == "JOIN":
                    token = data.get("token")
                    user = db_get_user_from_token(token) if token else None

                    # Legacy Teacher PIN fallback
                    if not user and (data.get("role") == "podium" or data.get("pin")):
                        pin = data.get("pin")
                        conn = get_db()
                        cur = conn.cursor()
                        cur.execute("SELECT teacher_pin, teacher_id FROM rooms WHERE id = ?", (room_id,))
                        r_row = cur.fetchone()
                        conn.close()
                        if r_row and str(r_row["teacher_pin"]) == str(pin):
                            teacher_id = r_row["teacher_id"] or "u_tch_euler"
                            conn = get_db()
                            cur = conn.cursor()
                            cur.execute("SELECT id, email, full_name, role FROM users WHERE id = ?", (teacher_id,))
                            u_row = cur.fetchone()
                            conn.close()
                            if u_row:
                                user = dict(u_row)

                    if not user:
                        await websocket.send(json.dumps({
                            "type": "AUTH_ERROR",
                            "message": "Authentication required. Please provide a valid session token."
                        }))
                        continue

                    # Multi-teacher isolation: verify teacher owns this room
                    if user["role"] == "teacher":
                        conn = get_db()
                        cur = conn.cursor()
                        cur.execute("SELECT teacher_id FROM rooms WHERE id = ?", (room_id,))
                        r_row = cur.fetchone()
                        conn.close()
                        if r_row and r_row["teacher_id"] and r_row["teacher_id"] != user["id"]:
                            await websocket.send(json.dumps({
                                "type": "AUTH_ERROR",
                                "message": "Access denied: You do not own this lecture room."
                            }))
                            continue

                    if room_id not in self.rooms:
                        self.rooms[room_id] = set()
                    self.rooms[room_id].add(websocket)
                    self.client_meta[websocket] = {
                        "user": user,
                        "room": room_id,
                        "role": user["role"],
                        "studentId": user["id"],
                        "ip": client_ip
                    }

                    # Scoped INIT_STATE:
                    # Teachers receive aggregate pulses and telemetry.
                    # Students receive only their own pulse, zero peer pulse leakage.
                    if user["role"] == "teacher":
                        state = db_get_room_state(room_id)
                    else:
                        db_enroll_student(room_id, user["id"])
                        state = db_get_student_room_state(room_id, user["id"])

                    await websocket.send(json.dumps({
                        "type": "INIT_STATE",
                        "data": state,
                        "user": user,
                        "connectedCount": len(self.rooms[room_id])
                    }))

                    # Notify room of updated roster count
                    await self.broadcast(room_id, {
                        "type": "PEER_COUNT",
                        "count": len(self.rooms[room_id])
                    })

                # --- 2. PULSE (Friction Signal) ---
                elif msg_type == "PULSE":
                    meta = self.client_meta.get(websocket)
                    if not meta or meta.get("role") != "student":
                        await websocket.send(json.dumps({
                            "type": "AUTH_ERROR",
                            "message": "Only authenticated students can signal friction pulses."
                        }))
                        continue

                    pulse_payload = data.get("data", {})
                    # FORCED SERVER IDENTITY: Ignore any client-sent studentId
                    student_id = meta["user"]["id"]
                    now_ms = int(time.time() * 1000)

                    # Rate limiting: 1 pulse per 15s per student
                    cooldown_key = (room_id, student_id)
                    last_pulse = self.pulse_cooldowns.get(cooldown_key, 0)
                    if now_ms - last_pulse < 15000:
                        await websocket.send(json.dumps({
                            "type": "RATE_LIMIT",
                            "message": "Please wait before signaling friction again."
                        }))
                        continue
                    self.pulse_cooldowns[cooldown_key] = now_ms

                    pulse_record = {
                        "id": f"p_{now_ms}_{student_id}",
                        "room": room_id,
                        "studentId": student_id,
                        "tag": pulse_payload.get("tag", "step"),
                        "topic": pulse_payload.get("topic", ""),
                        "timestamp": now_ms
                    }

                    # Persist to SQLite
                    db_save_pulse(pulse_record, client_ip)

                    # Scoped broadcast: Teacher receives full pulse; peers receive anonymized pulse
                    for ws in list(self.rooms.get(room_id, [])):
                        ws_meta = self.client_meta.get(ws, {})
                        try:
                            if ws_meta.get("role") == "teacher":
                                await ws.send(json.dumps({"type": "PULSE", "data": pulse_record}))
                            else:
                                await ws.send(json.dumps({
                                    "type": "PULSE",
                                    "data": {
                                        "id": pulse_record["id"],
                                        "room": room_id,
                                        "tag": pulse_record["tag"],
                                        "topic": pulse_record["topic"],
                                        "timestamp": now_ms,
                                        "isMine": ws_meta.get("studentId") == student_id
                                    }
                                }))
                        except Exception:
                            pass

                # --- 3. RESOLVE (Comprehension Recovered) ---
                elif msg_type == "RESOLVE":
                    meta = self.client_meta.get(websocket)
                    if not meta or meta.get("role") != "student":
                        continue

                    # STRICT SERVER ENFORCEMENT: A student can ONLY resolve their own pulse!
                    student_id = meta["user"]["id"]
                    db_resolve_pulse(room_id, student_id)

                    # Scoped broadcast:
                    for ws in list(self.rooms.get(room_id, [])):
                        ws_meta = self.client_meta.get(ws, {})
                        try:
                            if ws_meta.get("role") == "teacher":
                                await ws.send(json.dumps({"type": "RESOLVE", "data": {"studentId": student_id}}))
                            else:
                                await ws.send(json.dumps({
                                    "type": "RESOLVE",
                                    "data": {
                                        "isMine": ws_meta.get("studentId") == student_id
                                    }
                                }))
                        except Exception:
                            pass

                # --- 4. QUESTION (Micro-backchannel) ---
                elif msg_type == "QUESTION":
                    meta = self.client_meta.get(websocket)
                    if not meta:
                        continue

                    q_data = data.get("data", {})
                    raw_text = q_data.get("text", "").strip()
                    if not raw_text or len(raw_text) > 120:
                        continue

                    # Moderation & Profanity Check
                    if PROFANITY_PATTERN.search(raw_text):
                        await websocket.send(json.dumps({
                            "type": "MODERATION_BLOCKED",
                            "message": "Question flagged for inappropriate language."
                        }))
                        continue

                    # 60s Question Cooldown
                    q_cooldown_key = (room_id, meta["user"]["id"])
                    now_ms = int(time.time() * 1000)
                    if now_ms - self.question_cooldowns.get(q_cooldown_key, 0) < 60000:
                        await websocket.send(json.dumps({
                            "type": "RATE_LIMIT",
                            "message": "Question submission cooldown: maximum 1 question per minute."
                        }))
                        continue
                    self.question_cooldowns[q_cooldown_key] = now_ms

                    q_data["room"] = room_id
                    q_data["studentId"] = meta["user"]["id"]
                    q_data["id"] = f"q_{now_ms}_{meta['user']['id'][-4:]}"
                    q_data["timestamp"] = now_ms
                    q_data["upvotes"] = 0
                    q_data["projected"] = False

                    db_save_question(q_data)
                    await self.broadcast(room_id, {
                        "type": "QUESTION",
                        "data": q_data
                    })

                # --- 5. UPVOTE ---
                elif msg_type == "UPVOTE":
                    q_id = data.get("data", {}).get("id")
                    if q_id:
                        db_upvote_question(q_id)
                        await self.broadcast(room_id, {
                            "type": "UPVOTE",
                            "data": { "id": q_id }
                        })

                # --- 6. PROJECT QUESTION ON STAGE (Teacher Only) ---
                elif msg_type == "PROJECT_QUESTION":
                    meta = self.client_meta.get(websocket, {})
                    user = meta.get("user")
                    if not user or user.get("role") != "teacher":
                        await websocket.send(json.dumps({
                            "type": "AUTH_ERROR",
                            "message": "Teacher permission required to project questions."
                        }))
                        continue

                    q_id = data.get("data", {}).get("id")
                    projected = data.get("data", {}).get("projected", True)
                    if q_id:
                        db_project_question(q_id, projected)
                        await self.broadcast(room_id, {
                            "type": "PROJECT_QUESTION",
                            "data": { "id": q_id, "projected": projected }
                        })

                # --- 7. LECTURE TOPIC UPDATE (Teacher Only) ---
                elif msg_type == "TOPIC":
                    meta = self.client_meta.get(websocket, {})
                    user = meta.get("user")
                    if not user or user.get("role") != "teacher":
                        await websocket.send(json.dumps({
                            "type": "AUTH_ERROR",
                            "message": "Teacher permission required to change lecture topic."
                        }))
                        continue

                    topic = data.get("data")
                    if topic:
                        db_save_topic(room_id, topic)
                        await self.broadcast(room_id, {
                            "type": "TOPIC",
                            "data": topic
                        })

                # --- 8. INTERVENTION LOGGED (Teacher Only) ---
                elif msg_type == "INTERVENTION":
                    meta = self.client_meta.get(websocket, {})
                    user = meta.get("user")
                    if not user or user.get("role") != "teacher":
                        await websocket.send(json.dumps({
                            "type": "AUTH_ERROR",
                            "message": "Teacher permission required to record interventions."
                        }))
                        continue

                    i_data = data.get("data", {})
                    i_data["room"] = room_id
                    if "timestamp" not in i_data:
                        i_data["timestamp"] = int(time.time() * 1000)
                    if "id" not in i_data:
                        i_data["id"] = f"i_{i_data['timestamp']}"
                    db_save_intervention(i_data)
                    await self.broadcast(room_id, {
                        "type": "INTERVENTION",
                        "data": i_data
                    })

        finally:
            meta = self.client_meta.get(websocket)
            room_id = meta["room"] if meta else None
            self.remove_client(websocket)
            if room_id:
                await self.broadcast(room_id, {
                    "type": "PEER_COUNT",
                    "count": len(self.rooms.get(room_id, set()))
                })

# ---------------------------------------------------------------------------
# 4. SERVER RUNNER & ENTRY POINT
# ---------------------------------------------------------------------------
def run_http_server(host, port):
    httpd = ThreadingHTTPServer((host, port), NudgePointHTTPHandler)
    print(f"  HTTP Asset Server running: http://{host}:{port}")
    httpd.serve_forever()

async def main():
    parser = argparse.ArgumentParser(description="NudgePoint Production Server")
    parser.add_argument("--lan", action="store_true", help="Bind to 0.0.0.0 (LAN network) instead of 127.0.0.1 (localhost)")
    parser.add_argument("--http-port", type=int, default=DEFAULT_HTTP_PORT, help=f"HTTP Port (default: {DEFAULT_HTTP_PORT})")
    parser.add_argument("--ws-port", type=int, default=DEFAULT_WS_PORT, help=f"WebSocket Port (default: {DEFAULT_WS_PORT})")
    args = parser.parse_args()

    # Determine Host Binding (Priority 2, Item 7: Default to localhost, require explicit --lan)
    bind_host = "0.0.0.0" if args.lan else DEFAULT_HOST

    # Initialize SQLite Database
    init_db()
    print("==================================================================")
    print("  [NudgePoint Hub] HTTP Server + WebSocket Pub/Sub + SQLite")
    print("==================================================================")
    print(f"  Database file:        {DB_FILE}")
    print(f"  Host binding:         {bind_host} ({'LAN Accessible' if args.lan else 'Localhost Only'})")
    print(f"  HTTP Web Port:        {args.http_port}")
    print(f"  WebSocket Pub/Sub:    {args.ws_port}")
    print("------------------------------------------------------------------")

    # Initialize WebSocket Hub
    global ws_hub
    ws_hub = WebSocketHub()

    # Start HTTP server in a daemon thread
    http_thread = threading.Thread(target=run_http_server, args=(bind_host, args.http_port), daemon=True)
    http_thread.start()

    # Start WebSocket Server in the main asyncio event loop
    async with websockets.serve(ws_hub.handle_client, bind_host, args.ws_port):
        print(f"  WebSocket Pub/Sub active: ws://{bind_host}:{args.ws_port}")
        print("  Ready for real-time classroom pulse connections.\n")
        await asyncio.Future() # keep running

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down NudgePoint server gracefully.")
        sys.exit(0)
