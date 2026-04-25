#!/usr/bin/env python3
"""HTTP bridge: app.controla.group -> Hermes loki CLI with per-user session persistence."""
import json
import os
import re
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERMES_HOME = "/root/kali-workspace/configs/.hermes"
SESSION_MAP_PATH = "/root/hermes-bridge/sessions.json"
TIMEOUT = 240

ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
HERMES_BOX = re.compile(r"\u256d\u2500\s*\u2695\s*Hermes.*?\u2570[\u2500]+\u256f", re.DOTALL)
SESSION_LINE = re.compile(r"^\s*Session(?:_id)?:\s*(\S+)", re.MULTILINE)
SAFE_ID = re.compile(r"[^a-zA-Z0-9_-]")

_lock = threading.Lock()


def load_sessions():
    try:
        with open(SESSION_MAP_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_sessions(data):
    tmp = SESSION_MAP_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, SESSION_MAP_PATH)


def get_user_session(profile: str, user_id: str):
    if not user_id:
        return None
    with _lock:
        data = load_sessions()
        return data.get(f"{profile}:{user_id}")


def set_user_session(profile: str, user_id: str, session_id: str):
    if not user_id or not session_id:
        return
    with _lock:
        data = load_sessions()
        data[f"{profile}:{user_id}"] = session_id
        save_sessions(data)


def extract_response(out: str) -> str:
    out_clean = ANSI.sub("", out)
    m = HERMES_BOX.search(out_clean)
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


def extract_session_id(out: str) -> str:
    m = SESSION_LINE.search(ANSI.sub("", out))
    return m.group(1) if m else ""


def build_message(message: str, user_id: str, user_name: str) -> str:
    if not user_id and not user_name:
        return message
    lines = [
        "=== CURRENT_USER ===",
        f"name: {user_name or 'unknown'}",
        f"id: {user_id or 'anon'}",
        "scope: STRICT — only use facts you know about THIS user_id. Ignore facts that belong to other user_ids.",
        "=== END_CURRENT_USER ===",
    ]
    return "\n".join(lines) + "\n\n" + message


def run_hermes(profile: str, message: str, resume_id: str | None) -> tuple[str, str]:
    env = dict(os.environ)
    env["HERMES_HOME"] = HERMES_HOME
    cmd = ["hermes"]
    if profile and profile != "default":
        cmd += ["-p", profile]
    cmd += ["chat", "-q", message]
    if resume_id:
        cmd += ["--resume", resume_id]
    res = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=TIMEOUT)
    out = res.stdout + "\n" + res.stderr
    return out, ""


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
        profile = body.get("profile", "default") or "default"
        message = (body.get("message") or "").strip()
        user_id = SAFE_ID.sub("", (body.get("user_id") or "").strip())[:32]
        user_name = (body.get("user_name") or "").strip()
        if not message:
            self.send_error(400, "Missing message")
            return

        full_message = build_message(message, user_id, user_name)
        resume_id = get_user_session(profile, user_id)

        try:
            out, _ = run_hermes(profile, full_message, resume_id)
            # If --resume failed (session expired/missing), retry without resume to start fresh.
            if resume_id and "No session found" in out:
                out, _ = run_hermes(profile, full_message, None)
            text = extract_response(out) or "(sin respuesta)"
            session_id = extract_session_id(out)
            if session_id:
                set_user_session(profile, user_id, session_id)
            payload = json.dumps({
                "text": text,
                "session": session_id,
                "profile": profile,
                "user_id": user_id,
                "resumed": bool(resume_id),
            })
        except subprocess.TimeoutExpired:
            payload = json.dumps({"error": "timeout", "text": "(Piter esta procesando una respuesta larga, vuelve a intentar)"})

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload.encode())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7771))
    print(f"Hermes bridge (multi-user with session persistence) listening on 127.0.0.1:{port}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
