#!/usr/bin/env python3
"""
NudgePoint 150+ Concurrent Client Scale Benchmark
Simulates 150 concurrent active student connections in a lecture hall,
verifying that the asyncio pub/sub server handles fan-out without dropouts.
"""

import asyncio
import json
import time
import sys
import websockets

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

WS_URI = "ws://127.0.0.1:8765"
ROOM = "CALC"
NUM_STUDENTS = 150

async def student_worker(idx, ready_event, pulse_received_count):
    student_id = f"scale_student_{idx:03d}"
    try:
        ws = await websockets.connect(WS_URI)
        await ws.send(json.dumps({
            "type": "JOIN",
            "room": ROOM,
            "role": "student",
            "studentId": student_id
        }))
        
        # Read init state
        init_msg = json.loads(await ws.recv())
        assert init_msg["type"] == "INIT_STATE"
        
        ready_event.set()
        
        # Listen for broadcast
        while True:
            raw = await ws.recv()
            msg = json.loads(raw)
            if msg.get("type") == "PULSE" and msg.get("data", {}).get("tag") == "benchmark_scale":
                pulse_received_count[0] += 1
                break
                
        await ws.close()
    except Exception as e:
        print(f"Error in student {idx}: {e}")

async def run_scale_test():
    print("==================================================================")
    print(f"  🚀 NudgePoint High-Density Hall Scale Test ({NUM_STUDENTS} Concurrent Clients)")
    print("==================================================================")
    
    # 1. Connect Teacher Podium
    podium_ws = await websockets.connect(WS_URI)
    await podium_ws.send(json.dumps({
        "type": "JOIN",
        "room": ROOM,
        "role": "podium",
        "pin": "8492"
    }))
    init = json.loads(await podium_ws.recv())
    assert init["type"] == "INIT_STATE"
    print("  [Podium] Connected and ready.")

    # 2. Connect 150 student clients concurrently
    print(f"  [Ramp-Up] Connecting {NUM_STUDENTS} student mobile sockets...")
    t0 = time.perf_counter()
    ready_events = [asyncio.Event() for _ in range(NUM_STUDENTS)]
    pulse_received = [0]
    
    tasks = [
        asyncio.create_task(student_worker(i, ready_events[i], pulse_received))
        for i in range(NUM_STUDENTS)
    ]
    
    await asyncio.gather(*(ev.wait() for ev in ready_events))
    ramp_time = time.perf_counter() - t0
    print(f"  ✅ All {NUM_STUDENTS} students connected in {ramp_time:.2f}s ({NUM_STUDENTS/ramp_time:.1f} connects/sec)!")

    # 3. Emit a benchmark broadcast from student 0
    print(f"  [Fan-Out Test] Broadcasting pulse from Student 0 to {NUM_STUDENTS} concurrent clients...")
    trigger_ws = await websockets.connect(WS_URI)
    await trigger_ws.send(json.dumps({
        "type": "JOIN",
        "room": ROOM,
        "role": "student",
        "studentId": "broadcaster_000"
    }))
    await trigger_ws.recv() # init

    broadcast_start = time.perf_counter()
    await trigger_ws.send(json.dumps({
        "type": "PULSE",
        "room": ROOM,
        "data": {
            "id": f"p_bench_{int(time.time()*1000)}",
            "studentId": "broadcaster_000",
            "tag": "benchmark_scale",
            "topic": "Multivariable Derivation"
        }
    }))

    # Wait for all students to receive the broadcast
    timeout = 5.0
    wait_start = time.time()
    while pulse_received[0] < NUM_STUDENTS and time.time() - wait_start < timeout:
        await asyncio.sleep(0.05)

    fanout_time_ms = (time.perf_counter() - broadcast_start) * 1000
    print(f"  ✅ Fan-out completed! {pulse_received[0]}/{NUM_STUDENTS} students received pulse in {fanout_time_ms:.2f} ms")
    assert pulse_received[0] == NUM_STUDENTS, f"Only {pulse_received[0]}/{NUM_STUDENTS} received broadcast"

    # Cleanup
    await trigger_ws.close()
    await podium_ws.close()
    await asyncio.gather(*tasks, return_exceptions=True)

    print("------------------------------------------------------------------")
    print(f"🎉 150+ CONCURRENT CLIENT SCALE VERIFICATION PASSED (0 Dropouts)!")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_scale_test())
