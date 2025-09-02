#!/usr/bin/env python3
"""
Training script for YOLOv8 Fruit Detection Model
Follows the steps outlined in the project requirements
"""

import os
import sys
from pathlib import Path
import re

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics", "roboflow"])
        print("✅ Dependencies installed successfully!")
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False
    
    return True

def download_dataset():
    """Download the fruit dataset using Roboflow"""
    print("\n🌐 Downloading dataset...")
    
    try:
        from roboflow import Roboflow
        
        # You'll need to replace these with your actual Roboflow credentials
        print("⚠️  Please provide your Roboflow API key and workspace details")
        api_key = input("Enter your Roboflow API key: ").strip()
        workspace = input("Enter your workspace name: ").strip()
        project_name = input("Enter your project name (default: fruit-object-detection): ").strip() or "fruit-object-detection"
        
        if not api_key or not workspace:
            print("❌ API key and workspace are required")
            return False
        
        rf = Roboflow(api_key=api_key)
        project = rf.workspace(workspace).project(project_name)
        dataset = project.version(1).download("yolov8")
        
        print(f"✅ Dataset downloaded successfully to: {dataset.location}")
        return True
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        print("💡 Alternative: Download manually from DatasetNinja and place in 'datasets/fruit-object-detection/'")
        return False

def train_model():
    """Train the YOLOv8 model"""
    print("\n🚀 Training YOLOv8 model...")
    
    try:
        from ultralytics import YOLO
        
        # Check if dataset exists
        # Use relative path from backend directory to project root
        current_dir = Path(__file__).parent  # backend/
        project_root = current_dir.parent     # waste-wise-hazer/
        dataset_path = project_root / "datasets" / "fruit-object-detection" / "data.yaml"
        
        print(f"🔍 Looking for dataset at: {dataset_path}")
        print(f"   Current directory: {current_dir}")
        print(f"   Project root: {project_root}")
        
        if not os.path.exists(dataset_path):
            print(f"❌ Dataset not found at: {dataset_path}")
            print("   Please download the dataset first or place it manually")
            return False
        
        # Read and display the data.yaml contents
        print(f"✅ Dataset found! Reading data.yaml...")
        try:
            import yaml
            with open(dataset_path, 'r') as f:
                data_config = yaml.safe_load(f)
            
            print(f"📋 Dataset configuration:")
            print(f"   Path: {data_config.get('path', 'NOT FOUND')}")
            print(f"   Train: {data_config.get('train', 'NOT FOUND')}")
            print(f"   Val: {data_config.get('val', 'NOT FOUND')}")
            print(f"   Classes: {data_config.get('nc', 'NOT FOUND')}")
            print(f"   Names: {data_config.get('names', 'NOT FOUND')}")
            
            # Check if the paths actually exist
            train_path = Path(dataset_path).parent / data_config.get('train', '')
            val_path = Path(dataset_path).parent / data_config.get('val', '')
            
            print(f"🔍 Checking actual paths:")
            print(f"   Train images exist: {train_path.exists()}")
            print(f"   Val images exist: {val_path.exists()}")
            
            if train_path.exists():
                train_images = list(train_path.glob('*.jpg')) + list(train_path.glob('*.png'))
                print(f"   Train images found: {len(train_images)}")
            
            if val_path.exists():
                val_images = list(val_path.glob('*.jpg')) + list(val_path.glob('*.png'))
                print(f"   Val images found: {len(val_images)}")
                
        except Exception as e:
            print(f"⚠️  Warning: Could not read data.yaml details: {e}")
        
        # Load pretrained model
        print("📥 Loading pretrained YOLOv8s model...")
        
        # Check CUDA availability and set device accordingly
        import torch
        if torch.cuda.is_available():
            device = "cuda:0"
            print(f"🚀 CUDA available, using GPU: {device}")
        else:
            device = "cpu"
            print(f"💻 CUDA not available, using CPU: {device}")
        
        model = YOLO("yolov8s.pt")
        
        # Check for existing training runs to resume from
        runs_dir = Path("runs/detect")
        existing_runs = []
        if runs_dir.exists():
            for run_dir in runs_dir.iterdir():
                if run_dir.is_dir() and run_dir.name.startswith("fruit-detection"):
                    existing_runs.append(run_dir.name)
        
        # Sort runs numerically to find the latest (e.g., 20 > 9)
        def _run_index(name: str) -> int:
            try:
                suffix = name.replace("fruit-detection", "")
                return int(suffix) if suffix.isdigit() else 0
            except Exception:
                return -1
        existing_runs.sort(key=_run_index)
        latest_run = existing_runs[-1] if existing_runs else None
        
        if latest_run:
            print(f"🔄 Found existing training run: {latest_run}")
            print(f"📁 Continuing training from: runs/detect/{latest_run}/weights/last.pt")
            
            # Check if we can continue training
            last_weights_path = f"runs/detect/{latest_run}/weights/last.pt"
            if os.path.exists(last_weights_path):
                print(f"✅ Found last checkpoint: {last_weights_path}")
                
                # Load the last weights to continue training
                print(f"📥 Loading last weights: {last_weights_path}")
                model = YOLO(last_weights_path)
                
                # Continue training in the same run directory
                # Adjust batch size for CPU training
                batch_size = 4 if device == "cpu" else 16
                print(f"📊 Using batch size: {batch_size} for {device}")
                print(f"🔄 Continuing training from epoch 26 to complete 50 epochs...")
                
                # The key insight: we need to use resume=True to continue the existing training
                # But we also need to handle the case where YOLOv8 thinks training is "finished"
                print("🔄 Attempting to resume existing training...")
                
                # First, try to resume normally
                try:
                    results = model.train(
                        data=dataset_path,
                        epochs=50,  # This will continue from where it left off
                        imgsz=640,
                        batch=batch_size,
                        patience=10,  # Early stopping
                        save=True,
                        project="runs/detect",
                        name=latest_run,
                        resume=True,  # Resume from last checkpoint
                        device=device  # Use detected device (CPU/GPU)
                    )
                except Exception as resume_error:
                    print(f"⚠️  Resume failed: {resume_error}")
                    
                    # If the error is about training being finished, we need to check the training state
                    if "finished" in str(resume_error).lower() or "nothing to resume" in str(resume_error).lower():
                        print("🔄 Training appears to be marked as finished. Checking training state...")
                        
                        # Check if there's a training state file we can modify
                        state_file = f"runs/detect/{latest_run}/train/results.csv"
                        if os.path.exists(state_file):
                            print(f"📊 Found training results: {state_file}")
                            print("🔄 Attempting to continue training by setting higher epoch target...")
                            
                            # Try to continue by setting a higher epoch target
                            results = model.train(
                                data=dataset_path,
                                epochs=75,  # Set higher than the "finished" 50 epochs
                                imgsz=640,
                                batch=batch_size,
                                patience=10,
                                save=True,
                                project="runs/detect",
                                name=latest_run,
                                resume=True,  # Try resume again with higher epochs
                                device=device
                            )
                        else:
                            print("❌ No training state found. Starting fresh training...")
                            # Fall back to starting fresh
                            results = model.train(
                                data=dataset_path,
                                epochs=50,
                                imgsz=640,
                                batch=batch_size,
                                patience=10,
                                save=True,
                                project="runs/detect",
                                name="fruit-detection",
                                resume=False,
                                device=device
                            )
                    else:
                        # Some other error occurred
                        print(f"❌ Unexpected error: {resume_error}")
                        raise resume_error
            else:
                print(f"❌ Last checkpoint not found at: {last_weights_path}")
                print("🔄 Starting fresh training...")
                
                # Start fresh training
                batch_size = 4 if device == "cpu" else 16
                print(f"📊 Using batch size: {batch_size} for {device}")
                
                results = model.train(
                    data=dataset_path,
                    epochs=50,
                    imgsz=640,
                    batch=batch_size,
                    patience=10,
                    save=True,
                    project="runs/detect",
                    name="fruit-detection",
                    resume=False,
                    device=device
                )
        else:
            # Start fresh training
            print("🎯 Starting fresh training...")
            print("   - Epochs: 50")
            print("   - Image size: 640")
            # Adjust batch size for CPU training
            batch_size = 4 if device == "cpu" else 16
            print(f"   - Batch size: {batch_size}")
            
            results = model.train(
                data=dataset_path,
                epochs=50,
                imgsz=640,
                batch=batch_size,
                patience=10,  # Early stopping
                save=True,
                project="runs/detect",
                name="fruit-detection",
                device=device  # Use detected device (CPU/GPU)
            )
        
        print("✅ Training completed successfully!")
        
        # Determine the actual run directory where training completed by scanning directories
        final_dir = None
        try:
            run_dirs = []
            runs_root = Path("runs/detect")
            if runs_root.exists():
                for d in runs_root.iterdir():
                    if d.is_dir() and d.name.startswith("fruit-detection"):
                        run_dirs.append(d)
            if run_dirs:
                # Prefer highest numeric suffix; fall back to most recent mtime
                def _run_index_dir(p: Path) -> int:
                    s = p.name.replace("fruit-detection", "")
                    return int(s) if s.isdigit() else 0
                run_dirs.sort(key=_run_index_dir)
                final_dir = run_dirs[-1]
                # If same numeric order, pick most recently modified
                final_dir = max(run_dirs, key=lambda p: p.stat().st_mtime)
        except Exception:
            final_dir = None
        final_path_str = (final_dir.as_posix() if final_dir else "runs/detect/fruit-detection") + "/weights/"
        print(f"📁 Model saved to: {final_path_str}")
        
        return True, device
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        return False, "cpu"

def test_model(device="cpu"):
    """Test the trained model"""
    print("\n🧪 Testing trained model...")
    
    try:
        from ultralytics import YOLO
        
        # Find the latest trained model (numerically and by mtime)
        runs_dir = Path("runs/detect")
        existing_runs = []
        if runs_dir.exists():
            for run_dir in runs_dir.iterdir():
                if run_dir.is_dir() and run_dir.name.startswith("fruit-detection"):
                    existing_runs.append(run_dir)
        def _run_index_dir(p: Path) -> int:
            s = p.name.replace("fruit-detection", "")
            return int(s) if s.isdigit() else 0
        if existing_runs:
            existing_runs.sort(key=_run_index_dir)
            # then pick most recently modified among top
            latest_dir = max(existing_runs, key=lambda p: p.stat().st_mtime)
            latest_run = latest_dir.name
        else:
            latest_run = None
        
        if not latest_run:
            print("❌ No trained models found")
            return False
        
        # Load trained model from the latest run
        model_path = f"runs/detect/{latest_run}/weights/best.pt"
        if not os.path.exists(model_path):
            print(f"❌ Trained model not found at: {model_path}")
            return False
        
        model = YOLO(model_path)
        
        # Test on a sample image (if available)
        current_dir = Path(__file__).parent  # backend/
        project_root = current_dir.parent     # waste-wise-hazer/
        test_images = [
            project_root / "datasets" / "fruit-object-detection" / "val" / "images",
            project_root / "datasets" / "fruit-object-detection" / "train" / "images"
        ]
        
        test_image = None
        for img_dir in test_images:
            if os.path.exists(img_dir):
                images = [f for f in os.listdir(img_dir) if f.endswith(('.jpg', '.jpeg', '.png'))]
                if images:
                    test_image = os.path.join(img_dir, images[0])
                    break
        
        if test_image:
            print(f"🔍 Testing on: {test_image}")
            # Use the same device for testing
            results = model(test_image, device=device)
            
            # Extract class counts
            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    class_ids = boxes.cls.tolist()
                    counts = {int(c): class_ids.count(c) for c in set(class_ids)}
                    print(f"📊 Detection counts: {counts}")
                    
                    # Show class names (matching data.yaml)
                    class_names = ["apple", "tangerine", "pear", "watermelon", "durian", 
                                 "lemon", "grape", "pineapple", "dragon fruit", "korean melon", "cantaloupe"]
                    for class_id, count in counts.items():
                        class_name = class_names[class_id] if class_id < len(class_ids) else f"Class {class_id}"
                        print(f"   {class_name}: {count}")
        
        print("✅ Model testing completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

def copy_model_to_production():
    """Copy the best model to the production models directory"""
    print("\n📋 Setting up production model...")
    
    try:
        import shutil
        
        # Find the latest trained model (numerically and by mtime)
        runs_dir = Path("runs/detect")
        existing_runs = []
        if runs_dir.exists():
            for run_dir in runs_dir.iterdir():
                if run_dir.is_dir() and run_dir.name.startswith("fruit-detection"):
                    existing_runs.append(run_dir)
        def _run_index_dir(p: Path) -> int:
            s = p.name.replace("fruit-detection", "")
            return int(s) if s.isdigit() else 0
        if existing_runs:
            existing_runs.sort(key=_run_index_dir)
            latest_dir = max(existing_runs, key=lambda p: p.stat().st_mtime)
            latest_run = latest_dir.name
        else:
            latest_run = None
        
        if not latest_run:
            print("❌ No trained models found")
            return False
        
        source_path = Path(f"runs/detect/{latest_run}/weights/best.pt")
        dest_path = Path("models/best.pt")
        
        if os.path.exists(source_path):
            os.makedirs("models", exist_ok=True)
            shutil.copy2(source_path, dest_path)
            print(f"✅ Model copied to: {dest_path}")
            return True
        else:
            print(f"❌ Source model not found at: {source_path}")
            return False
            
    except Exception as e:
        print(f"❌ Error copying model: {e}")
        return False

def main():
    print("🍎 Fruit Detection Model Training Pipeline")
    print("=" * 50)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed")
        return
    
    # Download dataset
    if not download_dataset():
        print("⚠️  Dataset download failed, but you can continue with manual setup")
    
    # Train model
    success, device = train_model()
    if not success:
        print("❌ Training failed")
        return
    
    # Test model (pass device parameter)
    if not test_model(device=device):
        print("⚠️  Model testing failed")
    
    # Copy to production
    if not copy_model_to_production():
        print("⚠️  Failed to copy model to production")
    
    print("\n" + "=" * 50)
    print("🎉 Training pipeline completed!")
    print("\nNext steps:")
    print("1. Start the backend: python app.py")
    print("2. Test the API: curl http://localhost:5000/api/health")
    print("3. Upload images via the frontend dashboard")

if __name__ == "__main__":
    main()


