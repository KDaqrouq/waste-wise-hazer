import base64
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.exceptions import HTTPException, RequestEntityTooLarge
from werkzeug.utils import secure_filename

from db import DetectionStore
from run_utils import BASE_DIR, find_run_for_weights, latest_run_dir, read_run_metrics, run_weights

log = logging.getLogger("hazer")

# Configuration (override with environment variables)
MODEL_PATH = Path(os.environ.get("HAZER_MODEL_PATH", BASE_DIR / "models" / "best.pt"))
DATA_DIR = Path(os.environ.get("HAZER_DATA_DIR", BASE_DIR))
MAX_UPLOAD_MB = float(os.environ.get("HAZER_MAX_UPLOAD_MB", 10))
MAX_SAVED_IMAGES = int(os.environ.get("HAZER_MAX_SAVED_IMAGES", 200))
DEFAULT_CONFIDENCE = 0.25


class YoloDetector:
    """Wraps an Ultralytics model and records where it came from."""

    def __init__(self, model, source, custom, metrics=None):
        self.model = model
        self.names = {int(k): v for k, v in model.names.items()}
        self.info = {
            "source": source,
            "custom": custom,
            "class_names": [self.names[i] for i in sorted(self.names)],
            "metrics": metrics,
        }

    def predict(self, image, conf):
        detections = []
        for result in self.model(image, conf=conf, verbose=False):
            if result.boxes is None:
                continue
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                class_id = int(box.cls[0])
                detections.append({
                    "class_id": class_id,
                    "class_name": self.names.get(class_id, f"class {class_id}"),
                    "confidence": float(box.conf[0]),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                })
        return detections


def load_detector():
    """Load the trained fruit model, falling back to the latest training run, then to stock YOLOv8n."""
    from ultralytics import YOLO

    if MODEL_PATH.exists():
        try:
            model = YOLO(str(MODEL_PATH))
            log.info("Model loaded from %s", MODEL_PATH)
            return YoloDetector(model, MODEL_PATH.name, True, read_run_metrics(find_run_for_weights(MODEL_PATH)))
        except Exception:
            log.exception("Could not load %s", MODEL_PATH)

    run_dir = latest_run_dir()
    weights = run_weights(run_dir) if run_dir else None
    if weights is not None:
        try:
            model = YOLO(str(weights))
            log.info("Model loaded from latest training run: %s", weights)
            return YoloDetector(model, f"{run_dir.name}/{weights.name}", True, read_run_metrics(run_dir))
        except Exception:
            log.exception("Could not load %s", weights)

    log.warning(
        "No trained fruit model found at %s. Using the stock COCO yolov8n model, which does not know "
        "the fruit classes. Run `python setup.py` to download the trained model.",
        MODEL_PATH,
    )
    return YoloDetector(YOLO(str(BASE_DIR / "yolov8n.pt")), "yolov8n.pt (generic COCO model)", False)


def draw_detections(image, detections):
    """Draw bounding boxes and labels on a copy of the image."""
    annotated = image.copy()
    for d in detections:
        x1, y1, x2, y2 = d["bbox"]
        label = f"{d['class_name']} {d['confidence']:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        top = max(y1, h + 10)  # keep the label inside the image for boxes at the top edge
        cv2.rectangle(annotated, (x1, top - h - 10), (x1 + w, top), (0, 255, 0), -1)
        cv2.putText(annotated, label, (x1, top - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
    return annotated


def count_classes(detections):
    counts = {}
    for d in detections:
        counts[d["class_name"]] = counts.get(d["class_name"], 0) + 1
    return counts


def prune_folder(folder, keep):
    """Delete the oldest files so at most `keep` remain."""
    files = sorted((p for p in folder.iterdir() if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in files[keep:]:
        try:
            old.unlink()
        except OSError:
            log.warning("Could not delete %s", old)


def parse_confidence(value):
    try:
        conf = float(value)
    except (TypeError, ValueError):
        return DEFAULT_CONFIDENCE
    return min(max(conf, 0.05), 0.95)


def create_app(detector=None, data_dir=DATA_DIR):
    data_dir = Path(data_dir)
    annotated_dir = data_dir / "annotated"
    captures_dir = data_dir / "camera_captures"
    annotated_dir.mkdir(parents=True, exist_ok=True)
    captures_dir.mkdir(parents=True, exist_ok=True)

    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = int(MAX_UPLOAD_MB * 1024 * 1024)
    CORS(app)

    detector = detector or load_detector()
    store = DetectionStore(data_dir / "history.db")

    def error(message, status):
        return jsonify({"success": False, "error": message}), status

    @app.errorhandler(RequestEntityTooLarge)
    def too_large(_):
        return error(f"Image is too large. The limit is {MAX_UPLOAD_MB:g} MB.", 413)

    def run_detection(save_original):
        file = request.files.get("image")
        if file is None or file.filename == "":
            return error("No image file provided", 400)

        data = file.read()
        image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            return error("That file isn't an image the server can read. Try a JPEG or PNG.", 400)

        # File names are generated here; nothing the client sends ends up in a path.
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        token = uuid.uuid4().hex[:8]
        if save_original:
            stored_name = f"camera_capture_{stamp}_{token}.jpg"
            (captures_dir / stored_name).write_bytes(data)
            prune_folder(captures_dir, MAX_SAVED_IMAGES)
        else:
            stored_name = secure_filename(file.filename) or "upload"

        conf = parse_confidence(request.form.get("conf"))
        started = time.perf_counter()
        detections = detector.predict(image, conf)
        elapsed = round(time.perf_counter() - started, 3)
        class_counts = count_classes(detections)

        ok, encoded = cv2.imencode(".jpg", draw_detections(image, detections), [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok:
            return error("Could not encode the annotated image", 500)
        annotated_bytes = encoded.tobytes()
        annotated_name = f"{stamp}_{token}.jpg"
        (annotated_dir / annotated_name).write_bytes(annotated_bytes)
        prune_folder(annotated_dir, MAX_SAVED_IMAGES)

        record_id = store.add(stored_name, detections, class_counts, annotated_name, elapsed)

        body = {
            "success": True,
            "id": record_id,
            "detections": detections,
            "annotated_image_url": "data:image/jpeg;base64," + base64.b64encode(annotated_bytes).decode(),
            "total_detections": len(detections),
            "class_counts": class_counts,
            "confidence_threshold": conf,
            "processing_time": elapsed,
        }
        if save_original:
            body["saved_as"] = stored_name
        return jsonify(body)

    def handle(save_original):
        try:
            return run_detection(save_original)
        except HTTPException:
            raise
        except Exception as e:
            log.exception("Detection failed")
            return error(f"Detection failed: {e}", 500)

    @app.post("/api/predict")
    def predict():
        """Run detection on an uploaded image."""
        return handle(save_original=False)

    @app.post("/api/camera-capture")
    def camera_capture():
        """Run detection on a camera photo and keep the original in camera_captures/."""
        return handle(save_original=True)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "healthy", "model": detector.info})

    @app.get("/api/classes")
    def classes():
        names = detector.info["class_names"]
        return jsonify({"classes": names, "total_classes": len(names)})

    @app.get("/api/history")
    def history():
        limit = min(max(request.args.get("limit", 10, type=int), 1), 100)
        return jsonify({"items": store.recent(limit)})

    @app.get("/api/history/<int:detection_id>/image")
    def history_image(detection_id):
        name = store.annotated_image(detection_id)
        path = annotated_dir / Path(name).name if name else None
        if path is None or not path.exists():
            return error("Image not found (it may have been cleaned up)", 404)
        return send_file(path, mimetype="image/jpeg", max_age=86400)

    @app.get("/api/stats")
    def stats():
        return jsonify({**store.stats(), "model": detector.info})

    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    host = os.environ.get("HAZER_HOST", "127.0.0.1")
    port = int(os.environ.get("HAZER_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app = create_app()
    print(f"Starting Food Detection API on http://{host}:{port} (debug {'on' if debug else 'off'})")
    app.run(host=host, port=port, debug=debug)
