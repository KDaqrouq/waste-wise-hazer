#!/usr/bin/env python3
"""
Setup script for the Food Detection backend.

Installs requirements, creates data folders and downloads the trained model
from the GitHub release if models/best.pt is missing.
"""

import os
import subprocess
import sys
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"
MODEL_URL = os.environ.get(
    "HAZER_MODEL_URL",
    "https://github.com/KDaqrouq/waste-wise-hazer/releases/latest/download/best.pt",
)


def install_requirements():
    """Install required Python packages"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(BASE_DIR / "requirements.txt")])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False


def create_directories():
    """Create the folders the API writes to"""
    for name in ["annotated", "camera_captures", "models"]:
        (BASE_DIR / name).mkdir(exist_ok=True)
    print("✅ Data folders ready")


def download_model():
    """Download the trained fruit model if it isn't there yet"""
    if MODEL_PATH.exists():
        print(f"✅ Found trained model: {MODEL_PATH}")
        return True

    print(f"Downloading trained model from {MODEL_URL} ...")
    tmp_path = MODEL_PATH.with_suffix(".part")
    try:
        def progress(blocks, block_size, total):
            if total > 0:
                pct = min(blocks * block_size * 100 // total, 100)
                print(f"\r   {pct}%", end="", flush=True)

        urllib.request.urlretrieve(MODEL_URL, tmp_path, reporthook=progress)
        tmp_path.replace(MODEL_PATH)
        print(f"\n✅ Model saved to {MODEL_PATH}")
        return True
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        print(f"\n⚠️  Could not download the model: {e}")
        print("   The API will start with the generic COCO yolov8n model, which does not know the fruit classes.")
        print(f"   Train one with `python train_model.py` or place your weights at {MODEL_PATH}")
        return False


def main():
    print("🚀 Setting up Food Detection Backend...")
    print("=" * 50)

    if not install_requirements():
        print("❌ Setup failed during requirements installation")
        sys.exit(1)

    create_directories()
    download_model()

    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\nTo start the backend server:")
    print("   python app.py")
    print("\nThe API will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")


if __name__ == "__main__":
    main()
