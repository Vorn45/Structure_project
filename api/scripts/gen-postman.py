#!/usr/bin/env python3
"""
Generate a Postman collection from a NestJS startup log.

Usage:
    python3 scripts/gen-postman.py [path/to/nest.log]

If no log path is given, reads $PMS_API_LOG. The log must contain RouterExplorer
"Mapped {path, METHOD}" lines from the captured stdout of `npm run start:dev`.

Quick way to produce one:
    npm run start:dev > /tmp/pms-api.log 2>&1 &
    sleep 8                # wait for routes to map
    python3 scripts/gen-postman.py /tmp/pms-api.log
"""
import json
import os
import re
import sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(SCRIPT_DIR)
DOCS_DIR = os.path.join(API_ROOT, "docs", "postman")
OUT = os.path.join(DOCS_DIR, "pms-api.postman_collection.json")
ENV_OUT = os.path.join(DOCS_DIR, "pms-api-local.postman_environment.json")
STATE = os.path.join(DOCS_DIR, "gen-state.json")
BASE = "{{baseUrl}}"

LOG = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PMS_API_LOG"))
if not LOG or not os.path.exists(LOG):
    print("error: provide log path as arg or PMS_API_LOG env var.", file=sys.stderr)
    print("       capture with: npm run start:dev > /tmp/pms-api.log 2>&1 &", file=sys.stderr)
    sys.exit(1)

os.makedirs(DOCS_DIR, exist_ok=True)


def next_version():
    n = 0
    if os.path.exists(STATE):
        try:
            with open(STATE) as f:
                n = int(json.load(f).get("version", 0))
        except Exception:
            n = 0
    n += 1
    with open(STATE, "w") as f:
        json.dump({"version": n, "updated_at": datetime.now().isoformat(timespec="seconds")}, f, indent=2)
    return n


VERSION = next_version()
TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
COLLECTION_NAME = f"PMS API - V{VERSION} - {TIMESTAMP}"

pat = re.compile(r"Mapped \{([^,]+), (GET|POST|PUT|DELETE|PATCH)\} route")

routes = set()
with open(LOG, "r", errors="ignore") as f:
    for line in f:
        for m in pat.finditer(line):
            path, method = m.group(1), m.group(2)
            routes.add((method, path))

routes = sorted(routes, key=lambda x: (x[1], x[0]))


# ── PMS folder maps ──────────────────────────────────────────────────────────
HOME_ROW1_CREATE = {
    "task":     "1-task",
    "activity": "2-activity",
    "plan":     "3-plan",
}
USER_HOME_LEAVES = {
    "user-info":         ("row-1", "1-userInfo"),
    "meeting-schedule":  ("row-1", "3-meeting-schedule"),
    "task-status":       ("row-2", "1-task-status"),
    "member":            ("row-2", "3-member"),
    "plan":              ("row-3", "1-plan"),
    "my-task":           ("row-4", "1-my-task"),
    "unread-activity":   ("row-4", "2-unread-activity"),
}
ADMIN_HOME_LEAVES = {
    "user-info":   ("row-1", "1-userInfo"),
    "user-active": ("row-2", "1-user-active"),
    "user-access": ("row-3", "1-user-access"),
}
USER_TASK_ROW1 = {
    "task-table":    "1-task-table",
    "task-kanban":   "2-task-kanban",
    "task-calendar": "3-task-calendar",
    "search-task":   "4-search-task",
    "create-task":   "5-create-task",
}
USER_TASK_ROW2 = {
    "chatroom": "1-chatroom",
}
USER_ACTIVITY = {
    "search": ("row-1", "1-search"),
    "create": ("row-1", "2-create"),
}
INSIDE_PLAN_GENERAL = {
    "task-status":     "1-task-status",
    "recent-activity": "2-recent-activity",
    "priority":        "3-priority",
    "type":            "4-type-of-task",
    "member":          "5-member",
}
INSIDE_PLAN_3PLAN = {
    "task":     "1-task",
    "activity": "2-activity",
}


AUTH_USERNAME_PATHS = {"login", "otp", "refresh", "resend-otp"}
AUTH_FORGET_PATHS   = {"forget-password", "reset-password"}
AUTH_TELEGRAM_PATHS = {"telegram", "telegram-login"}


def folder_key(path):
    """Map an API path to a tuple of folder names mirroring src/app/resources/*."""
    parts = [p for p in path.split("/") if p and not p.startswith(":")]
    if not parts or parts[0] != "api":
        return ("misc",)
    body = parts[1:]
    if not body:
        return ("root",)

    # ── /api/auth/* (current structure) ──────────────────────────────────────
    if body[0] == "auth":
        leaf = body[1] if len(body) >= 2 else None
        if leaf in AUTH_USERNAME_PATHS:
            return ("1-account", "1-auth", "1-login", "1-username")
        if leaf in AUTH_FORGET_PATHS:
            return ("1-account", "1-auth", "2-forgot-password")
        if leaf in AUTH_TELEGRAM_PATHS:
            return ("1-account", "1-auth", "1-login", "2-telegram")
        return ("1-account", "1-auth")

    # ── /api/account/* ───────────────────────────────────────────────────────
    if body[0] == "account":
        if len(body) >= 2 and body[1] == "profile":
            return ("1-account", "2-profile")
        return ("1-account",)

    # ── /api/user/* ──────────────────────────────────────────────────────────
    if body[0] == "user":
        if len(body) >= 2 and body[1] == "home":
            if len(body) >= 3 and body[2] == "create":
                sub = body[3] if len(body) >= 4 else None
                if sub in HOME_ROW1_CREATE:
                    return ("2-user", "1-home", "row-1", "2-create", HOME_ROW1_CREATE[sub])
                return ("2-user", "1-home", "row-1", "2-create")
            sub = body[2] if len(body) >= 3 else None
            if sub in USER_HOME_LEAVES:
                row, name = USER_HOME_LEAVES[sub]
                return ("2-user", "1-home", row, name)
            return ("2-user", "1-home")
        if len(body) >= 2 and body[1] == "task":
            sub = body[2] if len(body) >= 3 else None
            if sub in USER_TASK_ROW1:
                return ("2-user", "2-task", "row-1", USER_TASK_ROW1[sub])
            if sub in USER_TASK_ROW2:
                return ("2-user", "2-task", "row-2", USER_TASK_ROW2[sub])
            return ("2-user", "2-task")
        if len(body) >= 2 and body[1] == "activity":
            sub = body[2] if len(body) >= 3 else None
            if sub in USER_ACTIVITY:
                row, name = USER_ACTIVITY[sub]
                return ("2-user", "3-activity", row, name)
            return ("2-user", "3-activity", "row-2")
        if len(body) >= 2 and body[1] == "plan":
            if len(body) >= 3 and body[2] == "inside-plan":
                sub = body[3] if len(body) >= 4 else None
                if sub in INSIDE_PLAN_3PLAN:
                    return ("2-user", "4-plan", "1-inside-plan", "3-plan", INSIDE_PLAN_3PLAN[sub])
                if sub in INSIDE_PLAN_GENERAL:
                    return ("2-user", "4-plan", "1-inside-plan", "1-general", INSIDE_PLAN_GENERAL[sub])
                return ("2-user", "4-plan", "1-inside-plan")
            if len(body) >= 3 and body[2] == "team-member":
                return ("2-user", "4-plan", "1-inside-plan", "2-team-member")
            return ("2-user", "4-plan")
        return ("2-user",)

    # ── /api/org-admin/* ─────────────────────────────────────────────────────
    if body[0] == "org-admin":
        if len(body) >= 2 and body[1] == "home":
            if len(body) >= 3 and body[2] == "create":
                sub = body[3] if len(body) >= 4 else None
                if sub in HOME_ROW1_CREATE:
                    return ("3-org-admin", "1-home", "row-1", "2-create", HOME_ROW1_CREATE[sub])
                return ("3-org-admin", "1-home", "row-1", "2-create")
            sub = body[2] if len(body) >= 3 else None
            if sub in ADMIN_HOME_LEAVES:
                row, name = ADMIN_HOME_LEAVES[sub]
                return ("3-org-admin", "1-home", row, name)
            return ("3-org-admin", "1-home")
        if len(body) >= 2 and body[1] == "user":
            return ("3-org-admin", "user")
        if len(body) >= 2 and body[1] == "plan":
            return ("3-org-admin", "2-plan")
        return ("3-org-admin",)

    return (body[0],)


def short_name(path):
    parts = [p for p in path.lstrip("/").split("/") if p]
    non_param = [p for p in parts if not p.startswith(":")]
    if not non_param:
        return path
    return non_param[-1]


# ── Body templates ───────────────────────────────────────────────────────────
BODY_TEMPLATES = {
    ("POST", "/api/auth/login"):           {"username": "{{username}}", "password": "{{password}}"},
    ("POST", "/api/auth/otp"):             {"username": "{{username}}", "otp": "{{otpCode}}"},
    ("POST", "/api/auth/resend-otp"):      {"username": "{{username}}"},
    ("POST", "/api/auth/refresh"):         {"refresh_token": "{{refreshToken}}"},
    ("POST", "/api/auth/forget-password"): {"username": "{{username}}"},
    ("POST", "/api/auth/reset-password"):  {
        "username":         "{{username}}",
        "otp":              "{{otpCode}}",
        "new_password":     "NewPass@1010",
        "confirm_password": "NewPass@1010",
    },
    ("POST", "/api/auth/telegram"):        {
        "telegram_id":        "",
        "telegram_username":  "",
        "first_name":         "",
        "last_name":          "",
        "telegram_photo_url": "",
        "auth_date":          0,
        "hash":               "",
    },
    ("POST", "/api/account/profile/check-password"):  {"password": "{{password}}"},
    ("POST", "/api/account/profile/switch"):          {"role_id": 1},
    ("PUT",  "/api/account/profile/change-password"): {"current_password": "{{password}}", "new_password": "NewPass@1010"},
}

FORMDATA_TEMPLATES = {
    ("POST", "/api/user/home/create/task"): [
        {"key": "project_id", "value": "{{projectId}}", "type": "text"},
        {"key": "title", "value": "Postman Task", "type": "text"},
        {"key": "description", "value": "Task created from Postman form-data.", "type": "text"},
        {"key": "type", "value": "task", "type": "text"},
        {"key": "status", "value": "todo", "type": "text"},
        {"key": "priority", "value": "medium", "type": "text"},
        {"key": "assignee_ids", "value": "{{assigneeId}}", "type": "text"},
        {"key": "start_date", "value": "2026-05-25", "type": "text"},
        {"key": "end_date", "value": "2026-05-30", "type": "text"},
        {"key": "activity_id", "value": "", "type": "text", "disabled": True},
        {"key": "image", "type": "file", "src": []},
    ],
    ("POST", "/api/user/task/create-task"): [
        {"key": "project_id", "value": "{{projectId}}", "type": "text"},
        {"key": "title", "value": "Postman Task", "type": "text"},
        {"key": "description", "value": "Task created from Postman form-data.", "type": "text"},
        {"key": "type", "value": "task", "type": "text"},
        {"key": "status", "value": "todo", "type": "text"},
        {"key": "priority", "value": "medium", "type": "text"},
        {"key": "start_date", "value": "2026-05-25", "type": "text"},
        {"key": "end_date", "value": "2026-05-30", "type": "text"},
        {"key": "activity_id", "value": "", "type": "text", "disabled": True},
        {"key": "image", "type": "file", "src": []},
    ],
    ("POST", "/api/user/home/create/activity"): [
        {"key": "project_id", "value": "{{projectId}}", "type": "text"},
        {"key": "responsible_by", "value": "{{userId}}", "type": "text"},
        {"key": "en_category", "value": "Postman Activity", "type": "text"},
        {"key": "kh_category", "value": "Postman Activity", "type": "text"},
        {"key": "start_date", "value": "2026-05-25", "type": "text"},
        {"key": "end_date", "value": "2026-05-30", "type": "text"},
        {"key": "tasks", "value": json.dumps([{
            "title": "Postman Activity Task",
            "description": "Task created with activity form-data.",
            "type": "task",
            "status": "todo",
            "priority": "medium",
            "start_date": "2026-05-25",
            "end_date": "2026-05-30",
        }]), "type": "text"},
        {"key": "image", "type": "file", "src": []},
    ],
    ("POST", "/api/user/activity/create"): [
        {"key": "project_id", "value": "{{projectId}}", "type": "text"},
        {"key": "responsible_by", "value": "{{userId}}", "type": "text"},
        {"key": "en_category", "value": "Postman Activity", "type": "text"},
        {"key": "kh_category", "value": "Postman Activity", "type": "text"},
        {"key": "start_date", "value": "2026-05-25", "type": "text"},
        {"key": "end_date", "value": "2026-05-30", "type": "text"},
        {"key": "tasks", "value": json.dumps([{
            "title": "Postman Activity Task",
            "description": "Task created with activity form-data.",
            "type": "task",
            "status": "todo",
            "priority": "medium",
            "start_date": "2026-05-25",
            "end_date": "2026-05-30",
        }]), "type": "text"},
        {"key": "image", "type": "file", "src": []},
    ],
}

LOGIN_TEST_SCRIPT = """const res = pm.response.json();
const token = res?.token || res?.data?.token;
const refresh = res?.refresh_token || res?.data?.refresh_token;
if (token) { pm.environment.set('token', token); pm.environment.set('accessToken', token); }
if (refresh) pm.environment.set('refreshToken', refresh);
console.log('token saved:', !!token, 'refresh saved:', !!refresh);
"""

AUTH_TOKEN_PATHS = (
    "/api/auth/login",
    "/api/auth/otp",
    "/api/auth/refresh",
    "/api/auth/telegram",
)


def request_item(method, path):
    raw = BASE + path
    parts = path.lstrip("/").split("/")
    variables = []
    for p in parts:
        if p.startswith(":"):
            variables.append({"key": p[1:], "value": ""})
    item = {
        "name": short_name(path),
        "request": {
            "method": method,
            "header": [],
            "url": {
                "raw": raw,
                "host": [BASE],
                "path": parts,
            },
        },
        "response": [],
    }
    formdata = FORMDATA_TEMPLATES.get((method, path))
    if formdata:
        item["request"]["body"] = {"mode": "formdata", "formdata": formdata}
    elif method in ("POST", "PUT", "PATCH"):
        item["request"]["header"].append({"key": "Content-Type", "value": "application/json"})
        body_obj = BODY_TEMPLATES.get((method, path), {})
        item["request"]["body"] = {"mode": "raw", "raw": json.dumps(body_obj, indent=2)}
    if variables:
        item["request"]["url"]["variable"] = variables
    if path in AUTH_TOKEN_PATHS:
        item["event"] = [{
            "listen": "test",
            "script": {"type": "text/javascript", "exec": LOGIN_TEST_SCRIPT.splitlines()},
        }]
    return item


def ensure_folder(root, keys):
    cur = root
    for k in keys:
        existing = None
        for child in cur["item"]:
            if child.get("name") == k and "item" in child:
                existing = child
                break
        if existing is None:
            existing = {"name": k, "item": []}
            cur["item"].append(existing)
        cur = existing
    return cur


collection = {
    "info": {
        "name": COLLECTION_NAME,
        "description": f"Auto-generated from booted NestJS routes. {len(routes)} endpoints. Generated at {TIMESTAMP}.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "item": [],
    "variable": [
        {"key": "baseUrl", "value": "http://localhost:4001"},
        {"key": "token", "value": ""},
    ],
    "auth": {
        "type": "bearer",
        "bearer": [{"key": "token", "value": "{{token}}", "type": "string"}],
    },
}

root = {"item": collection["item"]}
included = 0
for method, path in routes:
    keys = folder_key(path)
    if keys == ("root",):
        continue
    folder = ensure_folder(root, keys)
    folder["item"].append(request_item(method, path))
    included += 1


def nat_key(name):
    m = re.match(r"^(\d+)-(.*)$", name)
    return (int(m.group(1)), m.group(2)) if m else (10**9, name)


def sort_tree(items):
    items.sort(key=lambda x: (0 if "item" in x else 1, nat_key(x.get("name", ""))))
    for it in items:
        if "item" in it:
            sort_tree(it["item"])


sort_tree(collection["item"])

with open(OUT, "w") as f:
    json.dump(collection, f, indent=2)


# ── Environment file ─────────────────────────────────────────────────────────
ENV_NAME = "PMS API - Local"
ENV_VARS = [
    ("baseUrl",      "http://localhost:4001", "default"),
    ("username",     "087600064",             "default"),
    ("userphone",    "087600064",             "default"),
    ("password",     "Pms@1234",              "secret"),
    ("otpCode",      "123456",                "default"),
    ("token",        "",                      "secret"),
    ("accessToken",  "",                      "secret"),
    ("refreshToken", "",                      "secret"),
]

environment = {
    "id":   "pms-api-local",
    "name": ENV_NAME,
    "values": [
        {"key": k, "value": v, "type": t, "enabled": True}
        for k, v, t in ENV_VARS
    ],
    "_postman_variable_scope": "environment",
    "_postman_exported_at":    datetime.now().isoformat(timespec="seconds") + "Z",
    "_postman_exported_using": "gen-postman.py",
}

if not os.path.exists(ENV_OUT):
    with open(ENV_OUT, "w") as f:
        json.dump(environment, f, indent=2)
    env_msg = f"wrote {ENV_OUT}"
else:
    env_msg = f"kept existing {ENV_OUT} (delete to regenerate)"

print(f"wrote {OUT} as '{COLLECTION_NAME}' with {included} routes (skipped {len(routes) - included})")
print(env_msg)
