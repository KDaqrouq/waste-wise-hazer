#!/usr/bin/env python3
"""
Training script for the YOLOv8 fruit detection model.

    python train_model.py                 # resume the latest unfinished run, or start a new one
    python train_model.py --fresh         # always start a new run from yolov8s.pt
    python train_model.py --epochs 75     # epochs for a new run (or a fine-tune of a finished run)

All paths are relative to this file, so it can be run from any folder.
"""

import argparse
import importlib.util
import shutil
import subprocess
import sys
from pathlib import Path

from run_utils import BASE_DIR, RUN_PREFIX, RUNS_DIR, latest_run_dir

PROJECT_ROOT = BASE_DIR.parent
DATASET_YAML = PROJECT_ROOT / "datasets" / "fruit-object-detection" / "data.yaml"
PRODUCTION_MODEL = BASE_DIR / "models" / "best.pt"
BASE_WEIGHTS = BASE_DIR / "yolov8s.pt"


def install_dependencies():
    """Install ultralytics if it's missing"""
    if importlib.util.find_spec("ultralytics") is not None:
        return True
    print("📦 Installing ultralytics...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics"])
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False


def download_dataset():
    """Download the fruit dataset from Roboflow, only if it isn't already there"""
    if DATASET_YAML.exists():
        print(f"✅ Dataset found at {DATASET_YAML.parent}")
        return True

    print("\n🌐 Dataset not found, downloading from Roboflow...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "roboflow"])
        from roboflow import Roboflow

        api_key = input("Enter your Roboflow API key: ").strip()
        workspace = input("Enter your workspace name: ").strip()
        project_name = input("Enter your project name (default: fruit-object-detection): ").strip() or "fruit-object-detection"
        if not api_key or not workspace:
            print("❌ API key and workspace are required")
            return False

        rf = Roboflow(api_key=api_key)
        dataset = rf.workspace(workspace).project(project_name).version(1).download(
            "yolov8", location=str(DATASET_YAML.parent)
        )
        print(f"✅ Dataset downloaded to: {dataset.location}")
        return DATASET_YAML.exists()
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        print(f"💡 Alternative: download it manually and place it in {DATASET_YAML.parent}")
        return False


def pick_device():
    import torch

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"{'🚀 Using GPU' if device != 'cpu' else '💻 CUDA not available, using CPU'}: {device}")
    return device


def train_model(epochs, fresh):
    """Train (or resume) and return the run directory, or None on failure"""
    from ultralytics import YOLO

    device = pick_device()
    batch = 4 if device == "cpu" else 16
    common = dict(data=str(DATASET_YAML), imgsz=640, batch=batch, patience=10, device=device,
                  project=str(RUNS_DIR))

    latest = None if fresh else latest_run_dir(prefer="last.pt")
    last_weights = latest / "weights" / "last.pt" if latest else None

    if last_weights is not None and last_weights.exists():
        print(f"🔄 Resuming {latest.name} from {last_weights}")
        try:
            model = YOLO(str(last_weights))
            model.train(resume=True)
            return Path(model.trainer.save_dir)
        except Exception as e:
            if "finished" not in str(e).lower() and "nothing to resume" not in str(e).lower():
                print(f"❌ Resume failed: {e}")
                return None
            # resume=True always stops at the run's original epoch count, so a finished run
            # can't be extended in place. Fine-tune a new run starting from its weights instead.
            print(f"ℹ️  {latest.name} already finished. Fine-tuning a new run from its weights for {epochs} epochs.")
            model = YOLO(str(last_weights))
            model.train(epochs=epochs, name=RUN_PREFIX, **common)
            return Path(model.trainer.save_dir)

    print(f"🎯 Starting a new run: {epochs} epochs, batch {batch}")
    model = YOLO(str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8s.pt")
    model.train(epochs=epochs, name=RUN_PREFIX, **common)
    return Path(model.trainer.save_dir)


def test_model(run_dir):
    """Run the trained model on one validation image and print the counts"""
    from ultralytics import YOLO

    weights = run_dir / "weights" / "best.pt"
    if not weights.exists():
        print(f"❌ Trained model not found at: {weights}")
        return False

    image = None
    for split in ["val", "train"]:
        folder = DATASET_YAML.parent / split / "images"
        if folder.is_dir():
            image = next((p for p in sorted(folder.iterdir()) if p.suffix.lower() in {".jpg", ".jpeg", ".png"}), None)
            if image:
                break
    if image is None:
        print("⚠️  No sample image found to test on")
        return True

    print(f"\n🧪 Testing on: {image}")
    model = YOLO(str(weights))
    for result in model(str(image), verbose=False):
        class_ids = [int(c) for c in result.boxes.cls.tolist()]
        for class_id in sorted(set(class_ids)):
            print(f"   {model.names.get(class_id, f'class {class_id}')}: {class_ids.count(class_id)}")
    return True


def copy_model_to_production(run_dir):
    """Copy the run's best.pt to models/best.pt, where app.py loads it from"""
    source = run_dir / "weights" / "best.pt"
    if not source.exists():
        print(f"❌ Source model not found at: {source}")
        return False
    PRODUCTION_MODEL.parent.mkdir(exist_ok=True)
    shutil.copy2(source, PRODUCTION_MODEL)
    print(f"✅ Model copied to: {PRODUCTION_MODEL}")
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--epochs", type=int, default=50, help="epochs for a new run (default: 50)")
    parser.add_argument("--fresh", action="store_true", help="start a new run instead of resuming")
    args = parser.parse_args()

    print("🍎 Fruit Detection Model Training Pipeline")
    print("=" * 50)

    if not install_dependencies():
        sys.exit(1)
    if not download_dataset():
        print("❌ No dataset, can't train")
        sys.exit(1)

    run_dir = train_model(args.epochs, args.fresh)
    if run_dir is None:
        print("❌ Training failed")
        sys.exit(1)
    print(f"✅ Training finished. Run saved to: {run_dir}")

    test_model(run_dir)
    copy_model_to_production(run_dir)

    print("\n" + "=" * 50)
    print("🎉 Training pipeline completed!")
    print("\nNext steps:")
    print("1. Start the backend: python app.py")
    print("2. Test the API: curl http://localhost:5000/api/health")
    print("3. Upload images via the frontend dashboard")


if __name__ == "__main__":
    main()
