import io

import cv2
import numpy as np
import pytest

from app import create_app


class FakeDetector:
    """Stands in for YOLO so the tests run in milliseconds and need no weights."""

    info = {"source": "fake.pt", "custom": True, "class_names": ["apple", "lemon"], "metrics": None}

    def __init__(self):
        self.last_conf = None

    def predict(self, image, conf):
        self.last_conf = conf
        return [
            {"class_id": 0, "class_name": "apple", "confidence": 0.9, "bbox": [1, 1, 20, 20]},
            {"class_id": 0, "class_name": "apple", "confidence": 0.8, "bbox": [30, 30, 50, 50]},
            {"class_id": 1, "class_name": "lemon", "confidence": 0.7, "bbox": [5, 40, 25, 60]},
        ]


def jpeg_bytes():
    ok, buf = cv2.imencode(".jpg", np.full((64, 64, 3), 200, np.uint8))
    assert ok
    return buf.tobytes()


@pytest.fixture
def detector():
    return FakeDetector()


@pytest.fixture
def client(tmp_path, detector):
    app = create_app(detector=detector, data_dir=tmp_path)
    return app.test_client()


def post_image(client, url, name="fruit.jpg", data=None, **form):
    payload = {"image": (io.BytesIO(data if data is not None else jpeg_bytes()), name), **form}
    return client.post(url, data=payload, content_type="multipart/form-data")


def test_predict_returns_counts_and_annotated_image(client):
    res = post_image(client, "/api/predict")
    body = res.get_json()
    assert res.status_code == 200
    assert body["total_detections"] == 3
    assert body["class_counts"] == {"apple": 2, "lemon": 1}
    assert body["annotated_image_url"].startswith("data:image/jpeg;base64,")


def test_confidence_is_passed_and_clamped(client, detector):
    post_image(client, "/api/predict", conf="0.6")
    assert detector.last_conf == 0.6
    post_image(client, "/api/predict", conf="5")
    assert detector.last_conf == 0.95
    post_image(client, "/api/predict", conf="nonsense")
    assert detector.last_conf == 0.25


def test_rejects_missing_and_invalid_images(client):
    assert client.post("/api/predict").status_code == 400
    res = post_image(client, "/api/predict", data=b"not an image")
    assert res.status_code == 400
    assert "isn't an image" in res.get_json()["error"]


def test_path_traversal_names_are_not_used_on_disk(client, tmp_path):
    post_image(client, "/api/predict", name="../../evil.jpg")
    post_image(client, "/api/camera-capture", name="x.jpg", timestamp="../../evil")
    assert not (tmp_path.parent / "evil.jpg").exists()
    assert not list(tmp_path.parent.glob("*evil*"))
    saved = [p.name for p in (tmp_path / "camera_captures").iterdir()]
    assert len(saved) == 1 and saved[0].startswith("camera_capture_")


def test_upload_size_limit(client, monkeypatch):
    client.application.config["MAX_CONTENT_LENGTH"] = 1024
    res = post_image(client, "/api/predict", data=b"x" * 4096)
    assert res.status_code == 413
    assert "too large" in res.get_json()["error"]


def test_saved_images_are_pruned(tmp_path, detector, monkeypatch):
    monkeypatch.setattr("app.MAX_SAVED_IMAGES", 3)
    client = create_app(detector=detector, data_dir=tmp_path).test_client()
    for _ in range(5):
        post_image(client, "/api/camera-capture")
    assert len(list((tmp_path / "annotated").iterdir())) == 3
    assert len(list((tmp_path / "camera_captures").iterdir())) == 3


def test_history_and_stats(client):
    post_image(client, "/api/predict")
    post_image(client, "/api/camera-capture")

    items = client.get("/api/history?limit=5").get_json()["items"]
    assert [i["source"] for i in items] == ["camera", "upload"]
    assert items[0]["timestamp"].endswith("Z")
    assert client.get(f"/api/history/{items[0]['id']}/image").status_code == 200
    assert client.get("/api/history/999/image").status_code == 404

    stats = client.get("/api/stats").get_json()
    assert stats["total_images"] == 2
    assert stats["total_items"] == 6
    assert stats["top_class"] == "apple"
    assert stats["daily"][-1]["images"] == 2
    assert stats["model"]["source"] == "fake.pt"


def test_health_reports_model(client):
    body = client.get("/api/health").get_json()
    assert body["model"]["custom"] is True
    assert client.get("/api/classes").get_json()["total_classes"] == 2
