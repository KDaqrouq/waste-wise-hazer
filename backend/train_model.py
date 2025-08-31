#!/usr/bin/env python3
"""
Training script for YOLOv8 Fruit Detection Model
Follows the steps outlined in the project requirements
"""

import os
import sys
from pathlib import Path

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
        dataset_path = "datasets/fruit-object-detection/data.yaml"
        if not os.path.exists(dataset_path):
            print(f"❌ Dataset not found at: {dataset_path}")
            print("   Please download the dataset first or place it manually")
            return False
        
        # Load pretrained model
        print("📥 Loading pretrained YOLOv8s model...")
        model = YOLO("yolov8s.pt")
        
        # Start training
        print("🎯 Starting training...")
        print("   - Epochs: 50")
        print("   - Image size: 640")
        print("   - Batch size: 16")
        
        results = model.train(
            data=dataset_path,
            epochs=50,
            imgsz=640,
            batch=16,
            patience=10,  # Early stopping
            save=True,
            project="runs/detect",
            name="fruit-detection"
        )
        
        print("✅ Training completed successfully!")
        print(f"📁 Model saved to: runs/detect/fruit-detection/weights/")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        return False

def test_model():
    """Test the trained model"""
    print("\n🧪 Testing trained model...")
    
    try:
        from ultralytics import YOLO
        
        # Load trained model
        model_path = "runs/detect/fruit-detection/weights/best.pt"
        if not os.path.exists(model_path):
            print(f"❌ Trained model not found at: {model_path}")
            return False
        
        model = YOLO(model_path)
        
        # Test on a sample image (if available)
        test_images = [
            "datasets/fruit-object-detection/val/images",
            "datasets/fruit-object-detection/train/images"
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
            results = model(test_image)
            
            # Extract class counts
            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    class_ids = boxes.cls.tolist()
                    counts = {int(c): class_ids.count(c) for c in set(class_ids)}
                    print(f"📊 Detection counts: {counts}")
                    
                    # Show class names
                    class_names = ["Apple", "Orange", "Banana", "Grape", "Strawberry", 
                                 "Peach", "Pear", "Kiwi", "Pineapple", "Mango"]
                    for class_id, count in counts.items():
                        class_name = class_names[class_id] if class_id < len(class_names) else f"Class {class_id}"
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
        
        source_path = "runs/detect/fruit-detection/weights/best.pt"
        dest_path = "models/best.pt"
        
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
    if not train_model():
        print("❌ Training failed")
        return
    
    # Test model
    if not test_model():
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

