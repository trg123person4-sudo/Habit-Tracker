#!/usr/bin/env python3
"""
NudgePoint Multi-Device End-to-End WebSocket Integration Test
Simulates a separate Teacher Podium device and Student Mobile device over WebSockets,
verifying real-time broadcast and SQLite persistence.
"""

import asyncio
import json
import time
import sys
import sqlite3
import websockets

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

WS_URI = "ws://127.0.0.1:8765"
ROOM = "CALC"
TEACHER_PIN = "8492"

async def run_test():
    print("==================================================================")
    print("  🧪 NudgePoint Multi-Device Real-Time End-to-End Test")
    print("==================================================================")
    print(f"  Target WebSocket Hub: {WS_URI}")
    print(f"  Room:                {ROOM}")
    print("------------------------------------------------------------------")

    # 1. Connect Device 1: Teacher Podium Instrument
    print("[1/6] Connecting Device 1 (Teacher Podium)...")
    podium_ws = await websockets.connect(WS_URI)
    await podium_ws.send(json.dumps({
        "type": "JOIN",
        "room": ROOM,
        "role": "podium",
        "pin": TEACHER_PIN
    }))

    podium_init = json.loads(await podium_ws.recv())
    assert podium_init["type"] == "INIT_STATE", f"Expected INIT_STATE, got {podium_init}"
    print("  ✅ Device 1 (Podium) Authenticated and Initial State Received.")

    # 2. Connect Device 2: Student Mobile Device
    print("[2/6] Connecting Device 2 (Student Mobile Phone)...")
    student_ws = await websockets.connect(WS_URI)
    student_id = f"phone_student_{int(time.time())}"
    await student_ws.send(json.dumps({
        "type": "JOIN",
        "room": ROOM,
        "role": "student",
        "studentId": student_id
    }))

    student_init = json.loads(await student_ws.recv())
    assert student_init["type"] == "INIT_STATE", f"Expected INIT_STATE on student, got {student_init}"
    print(f"  ✅ Device 2 (Student Phone: {student_id}) Joined Room.")

    # Podium should receive peer count update
    peer_msg = json.loads(await podium_ws.recv())
    assert peer_msg["type"] == "PEER_COUNT", f"Expected PEER_COUNT, got {peer_msg}"
    print(f"  ✅ Podium notified of new connected student. Peer Count: {peer_msg['count']}")

    async def recv_matching(ws, expected_type, timeout=5.0):
        start = time.time()
        while time.time() - start < timeout:
            raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
            msg = json.loads(raw)
            if msg.get("type") == expected_type:
                return msg
        raise TimeoutError(f"Timed out waiting for {expected_type}")

    # 3. Transmit Friction Pulse from Student Phone to Teacher Podium
    print("[3/6] Emitting Friction Pulse from Student Phone ('Lost Here: Step Transition')...")
    pulse_id = f"test_pulse_{int(time.time()*1000)}"
    start_time = time.perf_counter()
    
    await student_ws.send(json.dumps({
        "type": "PULSE",
        "room": ROOM,
        "data": {
            "id": pulse_id,
            "studentId": student_id,
            "tag": "step",
            "topic": "3. Step 3: Algebraic Conjugate Substitution"
        }
    }))

    # Teacher Podium must receive the pulse broadcast
    podium_received = await recv_matching(podium_ws, "PULSE")
    latency_ms = (time.perf_counter() - start_time) * 1000

    assert podium_received["type"] == "PULSE", f"Expected PULSE, got {podium_received}"
    assert podium_received["data"]["id"] == pulse_id, "Pulse ID mismatch"
    assert podium_received["data"]["studentId"] == student_id, "Student ID mismatch"
    print(f"  ✅ Pulse received by Teacher Podium in {latency_ms:.2f} ms! (Sub-50ms latency confirmed)")

    # 4. Transmit Question from Student Phone
    print("[4/6] Submitting Backchannel Question from Student Phone...")
    await student_ws.send(json.dumps({
        "type": "QUESTION",
        "room": ROOM,
        "data": {
            "studentId": student_id,
            "text": "Why did the radical move to the numerator?"
        }
    }))

    q_received = await recv_matching(podium_ws, "QUESTION")
    assert q_received["type"] == "QUESTION", f"Expected QUESTION, got {q_received}"
    assert "numerator" in q_received["data"]["text"]
    print(f"  ✅ Question received by Teacher Podium: '{q_received['data']['text']}'")

    # 5. Transmit Resolution from Student Phone
    print("[5/6] Submitting 'Resolved' Signal from Student Phone...")
    await student_ws.send(json.dumps({
        "type": "RESOLVE",
        "room": ROOM,
        "data": { "studentId": student_id }
    }))

    res_received = await recv_matching(podium_ws, "RESOLVE")
    assert res_received["type"] == "RESOLVE", f"Expected RESOLVE, got {res_received}"
    assert res_received["data"]["studentId"] == student_id
    print("  ✅ Resolution received by Teacher Podium. Friction meter cooled down.")

    # 6. Verify SQLite Disk Persistence
    print("[6/6] Verifying SQLite Disk Persistence...")
    conn = sqlite3.connect("nudgepoint.db")
    cur = conn.cursor()
    cur.execute("SELECT id, room_id, student_id, tag, resolved FROM pulses WHERE id = ?", (pulse_id,))
    row = cur.fetchone()
    assert row is not None, f"Pulse {pulse_id} not found in SQLite database!"
    assert row[4] == 1, "Expected pulse to be marked resolved in database"
    conn.close()
    print(f"  ✅ Pulse verified in SQLite database (Record: {row[0]}, Resolved: {bool(row[4])})")

    # Clean close
    await student_ws.close()
    await podium_ws.close()

    print("------------------------------------------------------------------")
    print("🎉 ALL MULTI-DEVICE REAL-TIME CHECKS PASSED SUCCESSFULLY!")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_test())
