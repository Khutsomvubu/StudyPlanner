"""
StudyFlow — Backend API & Relational Database Service
=====================================================
Built with Python, Flask, and SQLite.
Provides user isolation, authentication, CRUD APIs, timetable collision detection,
and an algorithmic study plan scheduling engine for university students.
"""

import os
import sys
import json
import sqlite3
import hashlib
import hmac
import time
import secrets
from datetime import datetime, timedelta
from functools import wraps

try:
    from flask import Flask, request, jsonify, g
    from flask_cors import CORS
except ImportError:
    print("[StudyFlow] Installing required packages 'flask' and 'flask-cors' is recommended:")
    print("            pip install flask flask-cors")
    raise

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get("STUDYFLOW_DB", "studyflow.db")
SECRET_KEY = os.environ.get("STUDYFLOW_SECRET", "studyflow-dev-secret-key-2026")
TOKEN_EXPIRY_HOURS = 72

def get_db():
    """Provides a thread-safe database connection for the current Flask request context."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        # Enable foreign key constraint enforcement in SQLite
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db

@app.teardown_appcontext
def close_db(exception=None):
    """Closes the database connection at the conclusion of each request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the relational tables adhering to the StudyFlow architecture specification."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                university TEXT,
                course TEXT,
                year_of_study TEXT,
                target_sleep REAL DEFAULT 8.0,
                wake_time TEXT DEFAULT '06:30',
                preferred_study_time TEXT DEFAULT 'Evening',
                default_study_block INTEGER DEFAULT 60,
                created_at TEXT NOT NULL
            );
        """)

        # 2. Modules Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS modules (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                lecturer TEXT,
                current_mark REAL DEFAULT 0.0,
                target_mark REAL DEFAULT 75.0,
                difficulty TEXT DEFAULT 'Medium',
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. Assessments Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module_id TEXT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                due_date TEXT NOT NULL,
                due_time TEXT DEFAULT '23:59',
                weight REAL DEFAULT 10.0,
                description TEXT,
                status TEXT DEFAULT 'Not started',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            );
        """)

        # 4. Timetable Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timetable (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module_id TEXT,
                day TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                location TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            );
        """)

        # 5. Daily Tasks Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                date TEXT NOT NULL,
                start_time TEXT,
                end_time TEXT,
                priority TEXT DEFAULT 'Medium',
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            );
        """)

        # 6. Study Sessions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                module_id TEXT,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                duration INTEGER DEFAULT 60,
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
            );
        """)

        # 7. Sleep Records Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sleep_records (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                bedtime TEXT NOT NULL,
                wake_time TEXT NOT NULL,
                duration REAL NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        conn.commit()

def hash_password(password: str) -> str:
    """Generates a secure salt and salted SHA-256 hash."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(stored_hash: str, password_candidate: str) -> bool:
    """Verifies candidate password against stored salt-hash."""
    try:
        salt, expected_hash = stored_hash.split(":")
        candidate_hash = hashlib.sha256((salt + password_candidate).encode("utf-8")).hexdigest()
        return hmac.compare_digest(candidate_hash, expected_hash)
    except Exception:
        return False

def generate_token(user_id: str) -> str:
    """Creates a signed time-stamped authentication token."""
    expiry = int(time.time()) + (TOKEN_EXPIRY_HOURS * 3600)
    payload = f"{user_id}|{expiry}"
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}|{signature}"

def verify_token(token: str):
    """Validates signature and expiration of an authentication token; returns user_id."""
    if not token:
        return None
    try:
        parts = token.split("|")
        if len(parts) != 3:
            return None
        user_id, expiry_str, signature = parts
        expiry = int(expiry_str)
        if time.time() > expiry:
            return None

        payload = f"{user_id}|{expiry}"
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if hmac.compare_digest(signature, expected_sig):
            return user_id
    except Exception:
        return None
    return None

def require_auth(f):
    """Decorator ensuring that incoming requests supply a valid Bearer token for user isolation."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""
        user_id = verify_token(token)

        if not user_id:
            return jsonify({"error": "Unauthorized", "message": "Valid authentication token required"}), 401

        g.current_user_id = user_id
        return f(*args, **kwargs)
    return decorated

@app.route("/api/auth/register", methods=["POST"])
def register():
    """Registers a new university student account."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    university = data.get("university", "").strip()
    course = data.get("course", "").strip()
    year_of_study = data.get("year_of_study", "1st Year")

    if not name or not email or not password:
        return jsonify({"error": "Validation failed", "message": "Name, email, and password are required"}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({"error": "Conflict", "message": "A student account with this email already exists"}), 409

    user_id = f"usr_{secrets.token_hex(8)}"
    pw_hash = hash_password(password)
    created_at = datetime.utcnow().isoformat()

    db.execute("""
        INSERT INTO users (id, name, email, password_hash, university, course, year_of_study, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, name, email, pw_hash, university, course, year_of_study, created_at))
    db.commit()

    token = generate_token(user_id)
    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "university": university,
            "course": course,
            "year_of_study": year_of_study
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    """Authenticates credentials and returns a secure token."""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Validation failed", "message": "Email and password are required"}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not verify_password(user["password_hash"], password):
        return jsonify({"error": "Unauthorized", "message": "Invalid email or password credentials"}), 401

    token = generate_token(user["id"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "university": user["university"],
            "course": user["course"],
            "year_of_study": user["year_of_study"],
            "target_sleep": user["target_sleep"],
            "wake_time": user["wake_time"],
            "preferred_study_time": user["preferred_study_time"],
            "default_study_block": user["default_study_block"]
        }
    })

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_current_user():
    """Retrieves profile of the authenticated student."""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (g.current_user_id,)).fetchone()
    if not user:
        return jsonify({"error": "Not found", "message": "User not found"}), 404

    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "university": user["university"],
        "course": user["course"],
        "year_of_study": user["year_of_study"],
        "target_sleep": user["target_sleep"],
        "wake_time": user["wake_time"],
        "preferred_study_time": user["preferred_study_time"],
        "default_study_block": user["default_study_block"]
    })

@app.route("/api/modules", methods=["GET"])
@require_auth
def list_modules():
    """Fetches all academic modules belonging to the authenticated student."""
    db = get_db()
    rows = db.execute("SELECT * FROM modules WHERE user_id = ? ORDER BY code ASC", (g.current_user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/modules", methods=["POST"])
@require_auth
def create_module():
    """Adds a new module with marks, target, and difficulty ratings."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip().upper()

    if not name or not code:
        return jsonify({"error": "Validation failed", "message": "Module name and code are mandatory"}), 400

    mod_id = data.get("id") or f"mod_{secrets.token_hex(6)}"
    db = get_db()
    db.execute("""
        INSERT INTO modules (id, user_id, name, code, lecturer, current_mark, target_mark, difficulty, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        mod_id,
        g.current_user_id,
        name,
        code,
        data.get("lecturer", ""),
        float(data.get("current_mark", 0.0)),
        float(data.get("target_mark", 75.0)),
        data.get("difficulty", "Medium"),
        data.get("notes", "")
    ))
    db.commit()
    return jsonify({"message": "Module created successfully", "id": mod_id}), 201

@app.route("/api/modules/<module_id>", methods=["DELETE"])
@require_auth
def delete_module(module_id):
    """Deletes a module owned by the student."""
    db = get_db()
    cursor = db.execute("DELETE FROM modules WHERE id = ? AND user_id = ?", (module_id, g.current_user_id))
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Not found", "message": "Module not found"}), 404
    return jsonify({"message": "Module deleted successfully"})

@app.route("/api/assessments", methods=["GET"])
@require_auth
def list_assessments():
    """Retrieves all assessments sorted by upcoming due dates."""
    db = get_db()
    rows = db.execute("""
        SELECT a.*, m.name AS module_name, m.code AS module_code
        FROM assessments a
        LEFT JOIN modules m ON a.module_id = m.id
        WHERE a.user_id = ?
        ORDER BY a.due_date ASC, a.due_time ASC
    """, (g.current_user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/assessments", methods=["POST"])
@require_auth
def create_assessment():
    """Records a new assessment, test, assignment, or examination."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    due_date = data.get("due_date", "").strip()

    if not name or not due_date:
        return jsonify({"error": "Validation failed", "message": "Name and due date are required"}), 400

    ass_id = data.get("id") or f"ass_{secrets.token_hex(6)}"
    db = get_db()
    db.execute("""
        INSERT INTO assessments (id, user_id, module_id, name, type, due_date, due_time, weight, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ass_id,
        g.current_user_id,
        data.get("module_id"),
        name,
        data.get("type", "Assignment"),
        due_date,
        data.get("due_time", "23:59"),
        float(data.get("weight", 10.0)),
        data.get("description", ""),
        data.get("status", "Not started")
    ))
    db.commit()
    return jsonify({"message": "Assessment added successfully", "id": ass_id}), 201

@app.route("/api/timetable", methods=["GET"])
@require_auth
def list_timetable():
    """Retrieves the weekly timetable schedule."""
    db = get_db()
    rows = db.execute("""
        SELECT t.*, m.name AS module_name, m.code AS module_code
        FROM timetable t
        LEFT JOIN modules m ON t.module_id = m.id
        WHERE t.user_id = ?
        ORDER BY t.start_time ASC
    """, (g.current_user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/timetable", methods=["POST"])
@require_auth
def create_timetable_entry():
    """Adds a timetable class slot with collision detection against overlapping periods."""
    data = request.get_json() or {}
    day = data.get("day", "").strip()
    start_time = data.get("start_time", "").strip()
    end_time = data.get("end_time", "").strip()

    if not day or not start_time or not end_time:
        return jsonify({"error": "Validation failed", "message": "Day, start time, and end time are required"}), 400

    if start_time >= end_time:
        return jsonify({"error": "Validation failed", "message": "End time must be later than start time"}), 400

    db = get_db()
    conflict = db.execute("""
        SELECT t.*, m.name AS module_name
        FROM timetable t
        LEFT JOIN modules m ON t.module_id = m.id
        WHERE t.user_id = ? AND LOWER(t.day) = LOWER(?)
          AND (? < t.end_time AND ? > t.start_time)
    """, (g.current_user_id, day, start_time, end_time)).fetchone()

    if conflict:
        return jsonify({
            "error": "Time Conflict",
            "message": f"Class overlaps with '{conflict['module_name'] or 'another class'}' ({conflict['start_time']} - {conflict['end_time']})"
        }), 409

    entry_id = data.get("id") or f"tt_{secrets.token_hex(6)}"
    db.execute("""
        INSERT INTO timetable (id, user_id, module_id, day, start_time, end_time, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        entry_id,
        g.current_user_id,
        data.get("module_id"),
        day,
        start_time,
        end_time,
        data.get("location", "Campus")
    ))
    db.commit()
    return jsonify({"message": "Timetable entry saved", "id": entry_id}), 201

@app.route("/api/tasks", methods=["GET"])
@require_auth
def list_tasks():
    """Retrieves student daily tasks."""
    db = get_db()
    rows = db.execute("""
        SELECT t.*, m.name AS module_name, m.code AS module_code
        FROM tasks t
        LEFT JOIN modules m ON t.module_id = m.id
        WHERE t.user_id = ?
        ORDER BY t.completed ASC, t.priority DESC, t.start_time ASC
    """, (g.current_user_id,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/tasks", methods=["POST"])
@require_auth
def create_task():
    """Creates a new daily task."""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    task_date = data.get("date", datetime.utcnow().strftime("%Y-%m-%d"))

    if not title:
        return jsonify({"error": "Validation failed", "message": "Task title is required"}), 400

    task_id = data.get("id") or f"tsk_{secrets.token_hex(6)}"
    db = get_db()
    db.execute("""
        INSERT INTO tasks (id, user_id, module_id, title, description, date, start_time, end_time, priority, completed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        task_id,
        g.current_user_id,
        data.get("module_id"),
        title,
        data.get("description", ""),
        task_date,
        data.get("start_time"),
        data.get("end_time"),
        data.get("priority", "Medium"),
        1 if data.get("completed") else 0
    ))
    db.commit()
    return jsonify({"message": "Task created successfully", "id": task_id}), 201

@app.route("/api/study-plan/generate", methods=["POST"])
@require_auth
def generate_study_plan():
    """
    Algorithmic Smart Study Plan Generator:
    Prioritizes modules based on:
      1. Approaching deadlines within the upcoming horizon (Assessment Weight * 3.0)
      2. Performance gap (Target Mark - Current Mark * 2.0)
      3. Module difficulty (Hard = +30, Medium = +15, Easy = +5)
    """
    data = request.get_json() or {}
    days_horizon = int(data.get("days", 7))
    hours_per_day = float(data.get("hours_per_day", 2.5))
    preferred_time = data.get("preferred_time", "Evening")
    session_duration = int(data.get("session_duration", 60))

    db = get_db()
    modules = db.execute("SELECT * FROM modules WHERE user_id = ?", (g.current_user_id,)).fetchall()
    if not modules:
        return jsonify({"error": "Precondition failed", "message": "Add modules before generating a study plan"}), 400

    assessments = db.execute("""
        SELECT * FROM assessments
        WHERE user_id = ? AND status != 'Completed'
    """, (g.current_user_id,)).fetchall()

    today = datetime.utcnow().date()
    module_scores = []

    for mod in modules:
        score = 0.0
        current = float(mod["current_mark"] or 0)
        target = float(mod["target_mark"] or 75)
        gap = max(0.0, target - current)
        score += gap * 2.0

        diff = mod["difficulty"]
        if diff == "Hard":
            score += 30.0
        elif diff == "Medium":
            score += 15.0
        else:
            score += 5.0

        mod_assessments = [a for a in assessments if a["module_id"] == mod["id"]]
        for ass in mod_assessments:
            try:
                due_d = datetime.strptime(ass["due_date"], "%Y-%m-%d").date()
                days_left = (due_d - today).days
                weight = float(ass["weight"] or 10.0)
                if days_left <= 3:
                    score += 60.0 + (weight * 1.5)
                elif days_left <= 7:
                    score += 35.0 + weight
                elif days_left <= 14:
                    score += 15.0
            except ValueError:
                pass

        module_scores.append({"module": dict(mod), "score": score})

    module_scores.sort(key=lambda x: x["score"], reverse=True)

    base_start_hour = 18
    if preferred_time == "Morning":
        base_start_hour = 8
    elif preferred_time == "Afternoon":
        base_start_hour = 14

    db.execute("DELETE FROM study_sessions WHERE user_id = ? AND completed = 0", (g.current_user_id,))

    generated_sessions = []
    mod_index = 0
    total_budget_minutes = int(hours_per_day * 60)

    for day_offset in range(days_horizon):
        session_date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        current_minute = base_start_hour * 60
        allocated_minutes = 0

        while (allocated_minutes + session_duration) <= total_budget_minutes:
            chosen_mod = module_scores[mod_index % len(module_scores)]["module"]
            start_h = f"{current_minute // 60:02d}"
            start_m = f"{current_minute % 60:02d}"
            end_minute = current_minute + session_duration
            end_h = f"{end_minute // 60:02d}"
            end_m = f"{end_minute % 60:02d}"

            session_id = f"ss_{secrets.token_hex(6)}"
            db.execute("""
                INSERT INTO study_sessions (id, user_id, module_id, date, start_time, end_time, duration, completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                session_id,
                g.current_user_id,
                chosen_mod["id"],
                session_date,
                f"{start_h}:{start_m}",
                f"{end_h}:{end_m}",
                session_duration
            ))

            generated_sessions.append({
                "id": session_id,
                "module_id": chosen_mod["id"],
                "module_name": chosen_mod["name"],
                "module_code": chosen_mod["code"],
                "date": session_date,
                "start_time": f"{start_h}:{start_m}",
                "end_time": f"{end_h}:{end_m}",
                "duration": session_duration,
                "completed": False
            })

            current_minute += session_duration + 15
            allocated_minutes += session_duration
            mod_index += 1

    db.commit()
    return jsonify({
        "message": f"Successfully generated {len(generated_sessions)} prioritized study sessions",
        "sessions": generated_sessions
    }), 201

@app.route("/api/sleep", methods=["GET"])
@require_auth
def list_sleep_records():
    """Returns sleep records and calculated weekly consistency statistics."""
    db = get_db()
    rows = db.execute("""
        SELECT * FROM sleep_records
        WHERE user_id = ?
        ORDER BY date DESC LIMIT 14
    """, (g.current_user_id,)).fetchall()

    records = [dict(r) for r in rows]
    total_duration = sum(r["duration"] for r in records)
    avg_sleep = round(total_duration / len(records), 2) if records else 0.0

    user = db.execute("SELECT target_sleep FROM users WHERE id = ?", (g.current_user_id,)).fetchone()
    target_sleep = user["target_sleep"] if user else 8.0

    consistency = 80
    if records:
        deviations = [abs(r["duration"] - target_sleep) for r in records]
        avg_deviation = sum(deviations) / len(deviations)
        consistency = max(40, int(100 - (avg_deviation * 15)))

    recommendation = "🌟 Good sleep consistency this week!"
    if avg_sleep > 0 and avg_sleep < (target_sleep - 0.5):
        recommendation = "💡 Your average sleep this week is below your target. Consider shifting evening study blocks earlier."

    return jsonify({
        "records": records,
        "average_sleep": avg_sleep,
        "target_sleep": target_sleep,
        "consistency_score": consistency,
        "recommendation": recommendation
    })

def seed_khutso_demo():
    """Pre-populates the database with realistic sample student data for Khutso Modise."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        existing = cursor.execute("SELECT id FROM users WHERE email = 'khutso@university.ac.za'").fetchone()
        if existing:
            return

        khutso_id = "usr_khutso_demo"
        pw_hash = hash_password("password123")
        now = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO users (id, name, email, password_hash, university, course, year_of_study, target_sleep, wake_time, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (khutso_id, "Khutso Modise", "khutso@university.ac.za", pw_hash, "Tshwane University of Technology", "Diploma in Multimedia Computing", "2nd Year", 8.0, "06:30", now))

        modules = [
            ("mod_1", khutso_id, "Programming A", "PPAF05D", "Dr. Van Der Merwe", 68.0, 75.0, "Hard", "OOP & Data structures"),
            ("mod_2", khutso_id, "Computational Mathematics", "CMAT02A", "Prof. Mokoena", 61.0, 75.0, "Hard", "Discrete mathematics and linear algebra"),
            ("mod_3", khutso_id, "Computer Fundamentals", "CFUN01B", "Mr. Nkosi", 78.0, 80.0, "Medium", "Hardware architecture"),
            ("mod_4", khutso_id, "Communication for Academic Purposes", "CAPF01D", "Ms. Smith", 82.0, 85.0, "Easy", "Academic writing and reporting")
        ]
        cursor.executemany("INSERT INTO modules VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", modules)
        conn.commit()

if __name__ == "__main__":
    init_db()
    seed_khutso_demo()
    port = int(os.environ.get("PORT", 5000))
    print(f"StudyFlow API running on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)