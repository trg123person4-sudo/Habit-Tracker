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
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import websockets

# Default Configuration
DEFAULT_HTTP_PORT = 8080
DEFAULT_WS_PORT = 8765
DEFAULT_HOST = "127.0.0.1"
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nudgepoint.db")

# In-Memory Room Hub
# { room_code: { "clients": set(), "teacher_pin": str, "active_topic": str, "pulse_cooldowns": dict, "question_cooldowns": dict } }
ROOMS = {}
ROOMS_LOCK = asyncio.Lock() if sys.version_info >= (3, 10) else None

# Basic Profanity / Abuse Filter
PROFANITY_PATTERN = re.compile(
    r"\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|nigger|nigga|faggot|retard|kill\s+yourself)\b",
    re.IGNORECASE
)

# ---------------------------------------------------------------------------
# 1. DATABASE PERSISTENCE (SQLite)
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
            active_topic TEXT,
            created_at INTEGER NOT NULL
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
        """)
        
        # Seed default room CALC if it does not exist
        cur = conn.cursor()
        cur.execute("SELECT id FROM rooms WHERE id = 'CALC'")
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO rooms (id, name, teacher_pin, active_topic, created_at) VALUES (?, ?, ?, ?, ?)",
                ("CALC", "MATH 201: Multivariable Calculus", "8492", "3. Step 3: Algebraic Conjugate Substitution", int(time.time() * 1000))
            )
            # Insert baseline seed question
            cur.execute(
                "INSERT INTO questions (id, room_id, student_id, text, upvotes, projected, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("q_seed_1", "CALC", "system", "Where did the common denominator (x+h) cancel out?", 8, 1, int(time.time() * 1000) - 120000)
            )
    conn.close()

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

    def do_GET(self):
        # REST API Routes
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            active_clients = sum(len(r.get("clients", set())) for r in ROOMS.values())
            res = {"status": "ok", "time": int(time.time()), "rooms": len(ROOMS), "activeClients": active_clients}
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if self.path.startswith("/api/sessions/") and self.path.endswith("/analytics"):
            parts = self.path.split("/")
            room_id = parts[3].upper() if len(parts) >= 5 else "CALC"
            data = db_get_historical_analytics(room_id)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if self.path.startswith("/api/rooms/") and self.path.endswith("/state"):
            parts = self.path.split("/")
            room_id = parts[3].upper() if len(parts) >= 5 else "CALC"
            data = db_get_room_state(room_id)
            if not data:
                self.send_response(404)
                self.end_headers()
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        # Deny access to sensitive or system files
        lower_path = self.path.lower()
        if lower_path.startswith("/.git") or lower_path.endswith(".db") or lower_path.endswith(".bat"):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Forbidden")
            return

        # Standard static file delivery
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/rooms/verify-pin":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(body)
                room_id = payload.get("room", "CALC").upper()
                pin = str(payload.get("pin", "")).strip()
                
                conn = get_db()
                cur = conn.cursor()
                cur.execute("SELECT teacher_pin FROM rooms WHERE id = ?", (room_id,))
                row = cur.fetchone()
                conn.close()
                
                valid = bool(row and row["teacher_pin"] == pin)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"success": valid}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

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
                    role = data.get("role", "student")
                    student_id = data.get("studentId", f"g_{int(time.time()*1000)%100000}")
                    teacher_pin = data.get("pin")

                    # If requesting podium role, verify PIN
                    if role == "podium":
                        conn = get_db()
                        cur = conn.cursor()
                        cur.execute("SELECT teacher_pin FROM rooms WHERE id = ?", (room_id,))
                        row = cur.fetchone()
                        conn.close()
                        if not row or str(row["teacher_pin"]) != str(teacher_pin):
                            await websocket.send(json.dumps({
                                "type": "AUTH_ERROR",
                                "message": "Invalid Teacher PIN for this lecture room."
                            }))
                            continue

                    if room_id not in self.rooms:
                        self.rooms[room_id] = set()
                    self.rooms[room_id].add(websocket)
                    self.client_meta[websocket] = {
                        "room": room_id,
                        "role": role,
                        "studentId": student_id,
                        "ip": client_ip
                    }

                    # Send current room state on join
                    state = db_get_room_state(room_id)
                    await websocket.send(json.dumps({
                        "type": "INIT_STATE",
                        "data": state,
                        "connectedCount": len(self.rooms[room_id])
                    }))

                    # Notify room of updated roster count
                    await self.broadcast(room_id, {
                        "type": "PEER_COUNT",
                        "count": len(self.rooms[room_id])
                    })

                # --- 2. PULSE (Friction Signal) ---
                elif msg_type == "PULSE":
                    pulse_payload = data.get("data", {})
                    student_id = pulse_payload.get("studentId", "anon")
                    
                    # Rate limiting: 1 pulse per 15s per student/IP
                    cooldown_key = (room_id, student_id, client_ip)
                    now_ms = int(time.time() * 1000)
                    last_pulse = self.pulse_cooldowns.get(cooldown_key, 0)
                    if now_ms - last_pulse < 15000:
                        await websocket.send(json.dumps({
                            "type": "RATE_LIMIT",
                            "message": "Please wait before signaling friction again."
                        }))
                        continue
                    self.pulse_cooldowns[cooldown_key] = now_ms

                    pulse_payload["room"] = room_id
                    pulse_payload["timestamp"] = now_ms
                    if "id" not in pulse_payload:
                        pulse_payload["id"] = f"p_{now_ms}_{student_id}"

                    # Persist to SQLite
                    db_save_pulse(pulse_payload, client_ip)

                    # Fan-out to all connected clients in the room
                    await self.broadcast(room_id, {
                        "type": "PULSE",
                        "data": pulse_payload
                    })

                # --- 3. RESOLVE (Comprehension Recovered) ---
                elif msg_type == "RESOLVE":
                    res_data = data.get("data", {})
                    student_id = res_data.get("studentId")
                    if student_id:
                        db_resolve_pulse(room_id, student_id)
                        await self.broadcast(room_id, {
                            "type": "RESOLVE",
                            "data": { "studentId": student_id }
                        })

                # --- 4. QUESTION (Micro-backchannel) ---
                elif msg_type == "QUESTION":
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
                    q_cooldown_key = (room_id, client_ip)
                    now_ms = int(time.time() * 1000)
                    if now_ms - self.question_cooldowns.get(q_cooldown_key, 0) < 60000:
                        await websocket.send(json.dumps({
                            "type": "RATE_LIMIT",
                            "message": "Question submission cooldown: maximum 1 question per minute."
                        }))
                        continue
                    self.question_cooldowns[q_cooldown_key] = now_ms

                    q_data["room"] = room_id
                    q_data["id"] = f"q_{now_ms}_{client_ip[-4:]}"
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

                # --- 6. PROJECT QUESTION ON STAGE ---
                elif msg_type == "PROJECT_QUESTION":
                    meta = self.client_meta.get(websocket, {})
                    if meta.get("role") == "podium":
                        q_id = data.get("data", {}).get("id")
                        projected = data.get("data", {}).get("projected", True)
                        if q_id:
                            db_project_question(q_id, projected)
                            await self.broadcast(room_id, {
                                "type": "PROJECT_QUESTION",
                                "data": { "id": q_id, "projected": projected }
                            })

                # --- 7. LECTURE TOPIC UPDATE ---
                elif msg_type == "TOPIC":
                    meta = self.client_meta.get(websocket, {})
                    if meta.get("role") == "podium":
                        topic = data.get("data")
                        if topic:
                            db_save_topic(room_id, topic)
                            await self.broadcast(room_id, {
                                "type": "TOPIC",
                                "data": topic
                            })

                # --- 8. INTERVENTION LOGGED ---
                elif msg_type == "INTERVENTION":
                    meta = self.client_meta.get(websocket, {})
                    if meta.get("role") == "podium":
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

    # Start HTTP server in a daemon thread
    http_thread = threading.Thread(target=run_http_server, args=(bind_host, args.http_port), daemon=True)
    http_thread.start()

    # Start WebSocket Server in the main asyncio event loop
    hub = WebSocketHub()
    async with websockets.serve(hub.handle_client, bind_host, args.ws_port):
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
