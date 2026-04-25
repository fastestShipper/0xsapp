#!/usr/bin/env python3
"""Minimal HTTP bridge: app.controla.group -> Hermes loki CLI."""
import json
import os
import re
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERMES_HOME = "/root/kali-workspace/configs/.hermes"
TIMEOUT = 180

ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
HERMES_BOX = re.compile(r"\u256d\u2500\s*\u2695\s*Hermes.*?\u2570[\u2500]+\u256f", re.DOTALL)


def extract_response(out: str) -> str:
    out = ANSI.sub("", out)
    m = HERMES_BOX.search(out)
    if not m:
        return ""
    block = m.group(0)
    lines = []
    for line in block.split("\n"):
        if "\u2500" in line or "Hermes" in line or "\u256e" in line or "\u256f" in line or "\u256d" in line or "\u2570" in line:
            continue
        clean = line.strip("\u2502 ").rstrip()
        if clean:
            lines.append(clean)
    return " ".join(lines).strip()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a, **kw):
        pass

    def do_POST(self):
        if self.path != "/chat":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length).decode())
        except Exception:
            self.send_error(400, "Invalid JSON")
            return
        profile = body.get("profile", "default")
        message = body.get("message", "").strip()
        if not message:
            self.send_error(400, "Missing message")
            return
        env = dict(os.environ)
        env["HERMES_HOME"] = HERMES_HOME
        if profile and profile != "default":
            cmd = ["hermes", "-p", profile, "chat", "-q", message]
        else:
            cmd = ["hermes", "chat", "-q", message]
        try:
            res = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=TIMEOUT)
            text = extract_response(res.stdout) or extract_response(res.stderr) or "(sin respuesta)"
            session = ""
            for line in (res.stdout + "\n" + res.stderr).split("\n"):
                if line.strip().startswith("Session:"):
                    session = line.strip().split(":", 1)[1].strip()
            payload = json.dumps({"text": text, "session": session, "profile": profile})
        except subprocess.TimeoutExpired:
            payload = json.dumps({"error": "timeout", "text": "(Piter esta procesando una respuesta larga, vuelve a intentar)"})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload.encode())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7771))
    print(f"Hermes bridge listening on 127.0.0.1:{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
