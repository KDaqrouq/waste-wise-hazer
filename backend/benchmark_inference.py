#!/usr/bin/env python3
"""
Measure average inference time of the trained model.

Usage (from anywhere):
    python backend/benchmark_inference.py [path/to/image.jpg]
"""

import statistics
import sys
import time
from pathlib import Path
from typing import Optional

from run_utils import BASE_DIR, latest_run_dir, run_weights

PROJECT_ROOT = BASE_DIR.parent
DATASET_DIR = PROJECT_ROOT / "datasets" / "fruit-object-detection"


def find_model() -> Optional[Path]:
    model_path = BASE_DIR / "models" / "best.pt"
    if model_path.exists():
        return model_path
    run_dir = latest_run_dir()
    return run_weights(run_dir) if run_dir else None


def find_sample_image() -> Optional[Path]:
    """First image in val/, test/ or train/ of the dataset."""
    for split in ["val", "test", "train"]:
        folder = DATASET_DIR / split / "images"
        if folder.is_dir():
            images = sorted(p for p in folder.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
            if images:
                return images[0]
    return None


def main():
    try:
        from ultralytics import YOLO
    except ImportError as e:
        print("Error importing ultralytics:", e)
        sys.exit(1)

    model_path = find_model()
    if model_path is None:
        print("No model weights found. Run setup.py or train_model.py first.")
        sys.exit(1)

    image_path = Path(sys.argv[1]) if len(sys.argv) > 1 else find_sample_image()
    if image_path is None or not image_path.exists():
        print("No sample image found. Pass one: python benchmark_inference.py path/to/image.jpg")
        sys.exit(1)

    print(f"Model: {model_path}")
    print(f"Image: {image_path}")
    model = YOLO(str(model_path))

    try:
        import torch
        device = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
        print(f"Device: {device}")
    except ImportError:
        pass

    model(str(image_path), verbose=False)  # warm-up run, excluded from timing

    runs = 20
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        model(str(image_path), verbose=False)
        times.append(time.perf_counter() - start)

    print(f"\nInference timing over {runs} runs (seconds):")
    print(f"  average: {statistics.mean(times):.4f}")
    print(f"  median:  {statistics.median(times):.4f}")
    print(f"  fastest: {min(times):.4f}")
    print(f"  slowest: {max(times):.4f}")


if __name__ == "__main__":
    main()
