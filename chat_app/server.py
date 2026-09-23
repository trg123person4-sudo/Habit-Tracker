#!/usr/bin/env python3
"""
Real-Time Chat Application Server
Supports HTTP static asset serving, SQLite message history, and WebSocket pub/sub.
"""

import os
import sys
import json
import time
import uuid
import sqlite3
import argparse
import asyncio
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import websockets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "chat.db")

DEFAULT_HTTP_PORT = 8085
DEFAULT_WS_PORT = 8766
DEFAULT_HOST = "127.0.0.1"

# ---------------------------------------------------------------------------
# Database Management (SQLite)
# ---------------------------------------------------------------------------
def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                room TEXT NOT NULL,
                username TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp REAL NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reactions (
                message_id TEXT NOT NULL,
                username TEXT NOT NULL,
                emoji TEXT NOT NULL,
                PRIMARY KEY (message_id, username, emoji)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room, timestamp)")
        conn.commit()

def save_message(msg_id, room, username, text, timestamp):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO messages (id, room, username, text, timestamp) VALUES (?, ?, ?, ?, ?)",
            (msg_id, room, username, text, timestamp)
        )
        conn.commit()

def get_recent_messages(room, limit=50):
    with sqlite3.connect(DB_FILE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, room, username, text, timestamp FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT ?",
            (room, limit)
        )
        rows = cursor.fetchall()
        messages = [dict(r) for r in reversed(rows)]
        
        # Attach reactions
        for msg in messages:
            cursor.execute(
                "SELECT username, emoji FROM reactions WHERE message_id = ?",
                (msg["id"],)
            )
            rxn_rows = cursor.fetchall()
            rxn_map = {}
            for rxn in rxn_rows:
                e = rxn["emoji"]
                if e not in rxn_map:
                    rxn_map[e] = []
                rxn_map[e].append(rxn["username"])
            msg["reactions"] = rxn_map
            
        return messages

def add_reaction(msg_id, username, emoji):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        # Toggle reaction
        cursor.execute(
            "SELECT 1 FROM reactions WHERE message_id = ? AND username = ? AND emoji = ?",
            (msg_id, username, emoji)
        )
        if cursor.fetchone():
            cursor.execute(
                "DELETE FROM reactions WHERE message_id = ? AND username = ? AND emoji = ?",
                (msg_id, username, emoji)
            )
            added = False
        else:
            cursor.execute(
                "INSERT INTO reactions (message_id, username, emoji) VALUES (?, ?, ?)",
                (msg_id, username, emoji)
            )
            added = True
        conn.commit()
        return added

# ---------------------------------------------------------------------------
# WebSocket Real-Time Hub
# ---------------------------------------------------------------------------
class ChatHub:
    def __init__(self):
        # socket -> { 'username': str, 'room': str, 'id': str }
        self.clients = {}
        self.rooms = ["general", "tech", "random", "projects"]

    def get_room_users(self, room):
        users = []
        for info in self.clients.values():
            if info.get("room") == room and info.get("username"):
                users.append(info["username"])
        return sorted(list(set(users)))

    async def broadcast_to_room(self, room, payload, exclude_ws=None):
        msg_str = json.dumps(payload)
        coros = []
        for ws, info in list(self.clients.items()):
            if info.get("room") == room and ws != exclude_ws:
                coros.append(self._safe_send(ws, msg_str))
        if coros:
            await asyncio.gather(*coros, return_exceptions=True)

    async def _safe_send(self, ws, msg_str):
        try:
            await ws.send(msg_str)
        except Exception:
            pass

    async def handle_connection(self, websocket):
        client_id = str(uuid.uuid4())[:8]
        self.clients[websocket] = {
            "id": client_id,
            "username": None,
            "room": "general"
        }

        try:
            async for raw_msg in websocket:
                try:
                    data = json.loads(raw_msg)
                except json.JSONDecodeError:
                    continue

                msg_type = data.get("type")
                current_info = self.clients.get(websocket, {})

                if msg_type == "join":
                    username = str(data.get("username", "Guest")).strip()[:24] or f"Guest_{client_id}"
                    room = str(data.get("room", "general")).strip().lower()
                    if room not in self.rooms:
                        self.rooms.append(room)

                    current_info["username"] = username
                    current_info["room"] = room

                    # Send welcome/init payload
                    history = get_recent_messages(room)
                    room_users = self.get_room_users(room)

                    await websocket.send(json.dumps({
                        "type": "init",
                        "username": username,
                        "room": room,
                        "rooms": self.rooms,
                        "history": history,
                        "users": room_users
                    }))

                    # Notify room of user join
                    await self.broadcast_to_room(room, {
                        "type": "system",
                        "room": room,
                        "text": f"👋 {username} joined #{room}",
                        "timestamp": time.time(),
                        "users": room_users
                    }, exclude_ws=websocket)

                elif msg_type == "message":
                    username = current_info.get("username")
                    room = current_info.get("room", "general")
                    text = str(data.get("text", "")).strip()

                    if not username or not text:
                        continue

                    # Truncate overly long messages
                    text = text[:2000]
                    msg_id = str(uuid.uuid4())
                    timestamp = time.time()

                    save_message(msg_id, room, username, text, timestamp)

                    payload = {
                        "type": "message",
                        "id": msg_id,
                        "room": room,
                        "username": username,
                        "text": text,
                        "timestamp": timestamp,
                        "reactions": {}
                    }
                    await self.broadcast_to_room(room, payload)

                elif msg_type == "typing":
                    username = current_info.get("username")
                    room = current_info.get("room")
                    is_typing = bool(data.get("isTyping", False))
                    if username and room:
                        await self.broadcast_to_room(room, {
                            "type": "typing",
                            "room": room,
                            "username": username,
                            "isTyping": is_typing
                        }, exclude_ws=websocket)

                elif msg_type == "reaction":
                    username = current_info.get("username")
                    room = current_info.get("room")
                    msg_id = data.get("messageId")
                    emoji = data.get("emoji")
                    if username and room and msg_id and emoji:
                        added = add_reaction(msg_id, username, emoji)
                        await self.broadcast_to_room(room, {
                            "type": "reaction",
                            "messageId": msg_id,
                            "emoji": emoji,
                            "username": username,
                            "added": added
                        })

                elif msg_type == "switch_room":
                    old_room = current_info.get("room")
                    new_room = str(data.get("room", "general")).strip().lower()
                    username = current_info.get("username")

                    if new_room not in self.rooms:
                        self.rooms.append(new_room)

                    current_info["room"] = new_room

                    # Notify old room
                    if old_room and username:
                        await self.broadcast_to_room(old_room, {
                            "type": "system",
                            "room": old_room,
                            "text": f"{username} left #{old_room}",
                            "timestamp": time.time(),
                            "users": self.get_room_users(old_room)
                        })

                    # Send new room state
                    history = get_recent_messages(new_room)
                    new_users = self.get_room_users(new_room)
                    await websocket.send(json.dumps({
                        "type": "room_switched",
                        "room": new_room,
                        "rooms": self.rooms,
                        "history": history,
                        "users": new_users
                    }))

                    # Notify new room
                    if username:
                        await self.broadcast_to_room(new_room, {
                            "type": "system",
                            "room": new_room,
                            "text": f"{username} switched to #{new_room}",
                            "timestamp": time.time(),
                            "users": new_users
                        }, exclude_ws=websocket)

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            info = self.clients.pop(websocket, None)
            if info and info.get("username") and info.get("room"):
                room = info["room"]
                username = info["username"]
                await self.broadcast_to_room(room, {
                    "type": "system",
                    "room": room,
                    "text": f"{username} went offline",
                    "timestamp": time.time(),
                    "users": self.get_room_users(room)
                })

# ---------------------------------------------------------------------------
# HTTP Static Asset Server
# ---------------------------------------------------------------------------
class ChatHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Prevent aggressive caching for active development
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        # Inject dynamic config for WebSocket port matching
        if self.path == "/config.json":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            config_data = {
                "wsPort": getattr(self.server, "ws_port", DEFAULT_WS_PORT)
            }
            self.wfile.write(json.dumps(config_data).encode("utf-8"))
            return
        super().do_GET()

def run_http_server(host, port, ws_port):
    server = ThreadingHTTPServer((host, port), ChatHTTPHandler)
    server.ws_port = ws_port
    print(f"📡 HTTP Web Server listening at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

# ---------------------------------------------------------------------------
# Main Orchestrator
# ---------------------------------------------------------------------------
async def run_ws_server(host, ws_port, hub):
    print(f"⚡ WebSocket Engine listening at ws://{host}:{ws_port}")
    async with websockets.serve(hub.handle_connection, host, ws_port):
        await asyncio.Future()  # run forever

def main():
    parser = argparse.ArgumentParser(description="Real-Time Chat Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host binding (default: 127.0.0.1)")
    parser.add_argument("--http-port", type=int, default=DEFAULT_HTTP_PORT, help="HTTP Port (default: 8085)")
    parser.add_argument("--ws-port", type=int, default=DEFAULT_WS_PORT, help="WebSocket Port (default: 8766)")
    parser.add_argument("--lan", action="store_true", help="Bind to 0.0.0.0 for Local Network access")

    args = parser.parse_args()
    host = "0.0.0.0" if args.lan else args.host

    init_db()
    hub = ChatHub()

    # Start HTTP server in a daemon thread
    http_thread = threading.Thread(
        target=run_http_server,
        args=(host, args.http_port, args.ws_port),
        daemon=True
    )
    http_thread.start()

    print("=======================================================")
    print("  💬 Real-Time Chat Server Initialized")
    print(f"  👉 Web App URL : http://localhost:{args.http_port}")
    if args.lan:
        print(f"  🌐 LAN Access   : http://<YOUR_IP>:{args.http_port}")
    print("  👉 Press Ctrl+C to stop the server")
    print("=======================================================")

    try:
        asyncio.run(run_ws_server(host, args.ws_port, hub))
    except KeyboardInterrupt:
        print("\nShutting down chat server gracefully.")
        sys.exit(0)

if __name__ == "__main__":
    main()
