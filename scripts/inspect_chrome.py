import subprocess
import time
import urllib.request
import json
import asyncio
import websockets
import os
import base64
import sys
import shutil

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

temp_dir = os.path.join(os.environ.get('TEMP', '.'), f'np_chrome_inspect_{int(time.time())}')
os.makedirs(temp_dir, exist_ok=True)

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [
    chrome_path,
    '--headless=new',
    '--disable-extensions',
    f'--user-data-dir={temp_dir}',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--window-size=1280,1400',
    'http://localhost:8080/#view=studio&room=CALC'
]
proc = subprocess.Popen(cmd)

tabs = []
for attempt in range(12):
    time.sleep(1)
    try:
        raw = urllib.request.urlopen('http://127.0.0.1:9222/json', timeout=2).read()
        tabs = json.loads(raw)
        if any('localhost:8080' in t.get('url', '') for t in tabs):
            break
    except Exception as e:
        print(f'Waiting for Chrome on port 9222 (attempt {attempt+1}/12)...', flush=True)

try:
    np_tabs = [t for t in tabs if 'localhost:8080' in t.get('url', '')]
    if not np_tabs:
        print('No localhost:8080 tab found! All tabs:', [(t.get('title'), t.get('url')) for t in tabs], flush=True)
        exit(1)
    
    target = np_tabs[0]
    ws_url = target['webSocketDebuggerUrl']
    print('Connected to target URL:', target['url'], flush=True)

    async def run():
        async with websockets.connect(ws_url) as ws:
            req_id = 0
            pending = {}

            async def send_cmd(method, params=None):
                nonlocal req_id
                req_id += 1
                fut = asyncio.get_running_loop().create_future()
                pending[req_id] = fut
                msg = {'id': req_id, 'method': method}
                if params:
                    msg['params'] = params
                await ws.send(json.dumps(msg))
                return await fut

            async def pump():
                try:
                    while True:
                        raw = await ws.recv()
                        msg = json.loads(raw)
                        if 'id' in msg and msg['id'] in pending:
                            pending[msg['id']].set_result(msg)
                except asyncio.CancelledError:
                    pass

            pump_task = asyncio.create_task(pump())

            await send_cmd('Runtime.enable')
            await asyncio.sleep(6)

            # Check lecture hall amphitheater elements
            eval_res = await send_cmd('Runtime.evaluate', {
                'expression': """
                    (() => {
                        const lectern = document.querySelector('.hall-stage-lectern');
                        const rows = document.querySelectorAll('.hall-row');
                        const seats = document.querySelectorAll('.hall-seat-card');
                        const scenarioBtns = Array.from(document.querySelectorAll('.hall-scenario-btn')).map(b => b.innerText.trim());
                        return {
                            hasLectern: !!lectern,
                            rowCount: rows.length,
                            seatCount: seats.length,
                            scenarios: scenarioBtns
                        };
                    })()
                """,
                'returnByValue': True
            })
            print('Amphitheater DOM Results:', eval_res.get('result', {}).get('result', {}).get('value'))

            # Trigger "+11 Algebraic Leap"
            leap_res = await send_cmd('Runtime.evaluate', {
                'expression': """
                    (() => {
                        const btns = Array.from(document.querySelectorAll('button'));
                        const leapBtn = btns.find(b => b.innerText.includes('Algebraic Leap'));
                        if (leapBtn) {
                            leapBtn.click();
                            return 'clicked: ' + leapBtn.innerText.trim();
                        }
                        return 'leap button not found';
                    })()
                """,
                'returnByValue': True
            })
            print('Scenario trigger:', leap_res.get('result', {}).get('result', {}).get('value'))
            await asyncio.sleep(1.5)

            # Check lost seat count
            lost_seats = await send_cmd('Runtime.evaluate', {
                'expression': 'document.querySelectorAll(".hall-seat-card.is-lost").length',
                'returnByValue': True
            })
            print('Lost seats count after Algebraic Leap:', lost_seats.get('result', {}).get('result', {}).get('value'))

            # Scroll down to amphitheater section and take screenshot
            await send_cmd('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1450)'})
            await asyncio.sleep(1)

            ss = await send_cmd('Page.captureScreenshot', {'format': 'png'})
            with open('amphitheater_sim_render.png', 'wb') as f:
                f.write(base64.b64decode(ss['result']['data']))
            print('Saved amphitheater_sim_render.png')

            pump_task.cancel()

    asyncio.run(run())
finally:
    proc.terminate()
