#!/usr/bin/env python3
"""
Setup script for Food Detection Backend
"""

import os
import subprocess
import sys

def install_requirements():
    """Install required Python packages"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def create_directories():
    """Create necessary directories"""
    print("Creating directories...")
    directories = ['uploads', 'annotated', 'models']
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def check_model():
    """Check if the trained model exists"""
    model_path = "models/best.pt"
    if os.path.exists(model_path):
        print(f"✅ Found trained model: {model_path}")
        return True
    else:
        print(f"⚠️  No trained model found at: {model_path}")
        print("   The API will use a default YOLOv8n model for testing")
        print("   Place your trained model at 'models/best.pt' for production use")
        return False

def main():
    print("🚀 Setting up Food Detection Backend...")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        print("❌ Setup failed during requirements installation")
        return
    
    # Create directories
    if not create_directories():
        print("❌ Setup failed during directory creation")
        return
    
    # Check model
    check_model()
    
    print("\n" + "=" * 50)
    print("✅ Setup completed successfully!")
    print("\nTo start the backend server:")
    print("   python app.py")
    print("\nThe API will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")

if __name__ == "__main__":
    main()


