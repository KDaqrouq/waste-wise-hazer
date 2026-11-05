"""
SQLite storage for detection history, used by the dashboard.
"""

import json
import sqlite3
from collections import Counter
from datetime import datetime, timedelta, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_filename TEXT,
    total_detections INTEGER,
    detections_json TEXT,
    class_counts_json TEXT,
    annotated_image_path TEXT,
    processing_time REAL
)
"""


class DetectionStore:
    def __init__(self, path):
        self.path = str(path)
        with self._connect() as conn:
            conn.execute(SCHEMA)

    def _connect(self):
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def add(self, image_filename, detections, class_counts, annotated_image_path, processing_time):
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO detections (image_filename, total_detections, detections_json,"
                " class_counts_json, annotated_image_path, processing_time) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    image_filename,
                    len(detections),
                    json.dumps(detections),
                    json.dumps(class_counts),
                    annotated_image_path,
                    processing_time,
                ),
            )
            return cur.lastrowid

    def annotated_image(self, detection_id):
        with self._connect() as conn:
            row = conn.execute(
                "SELECT annotated_image_path FROM detections WHERE id = ?", (detection_id,)
            ).fetchone()
        return row["annotated_image_path"] if row else None

    def recent(self, limit=10):
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM detections ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [_row_to_dict(r) for r in rows]

    def stats(self, days=7):
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT timestamp, total_detections, class_counts_json FROM detections"
            ).fetchall()

        class_totals = Counter()
        per_day = Counter()
        items_per_day = Counter()
        for row in rows:
            class_totals.update(json.loads(row["class_counts_json"] or "{}"))
            day = _parse_timestamp(row["timestamp"]).date().isoformat()
            per_day[day] += 1
            items_per_day[day] += row["total_detections"] or 0

        today = datetime.now(timezone.utc).date()
        last_days = [(today - timedelta(days=i)).isoformat() for i in range(days - 1, -1, -1)]
        top = class_totals.most_common(1)
        return {
            "total_images": len(rows),
            "total_items": sum(class_totals.values()),
            "class_totals": dict(class_totals.most_common()),
            "top_class": top[0][0] if top else None,
            "daily": [{"date": d, "images": per_day[d], "items": items_per_day[d]} for d in last_days],
        }


def _parse_timestamp(value):
    # SQLite CURRENT_TIMESTAMP is UTC in "YYYY-MM-DD HH:MM:SS" form
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)


def _row_to_dict(row):
    return {
        "id": row["id"],
        "timestamp": _parse_timestamp(row["timestamp"]).isoformat().replace("+00:00", "Z"),
        "image_filename": row["image_filename"],
        "source": "camera" if (row["image_filename"] or "").startswith("camera_capture") else "upload",
        "total_detections": row["total_detections"],
        "class_counts": json.loads(row["class_counts_json"] or "{}"),
        "detections": json.loads(row["detections_json"] or "[]"),
        "processing_time": row["processing_time"],
        "has_image": bool(row["annotated_image_path"]),
    }
