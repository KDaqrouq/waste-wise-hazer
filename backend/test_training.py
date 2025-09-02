#!/usr/bin/env python3
"""
Test script to verify training code changes
"""

import os
import sys
from pathlib import Path

def test_device_detection():
    """Test the device detection logic"""
    print("🧪 Testing device detection...")
    
    try:
        import torch
        if torch.cuda.is_available():
            device = "cuda:0"
            print(f"🚀 CUDA available, using GPU: {device}")
        else:
            device = "cpu"
            print(f"💻 CUDA not available, using CPU: {device}")
        
        print("✅ Device detection test passed!")
        return device
        
    except Exception as e:
        print(f"❌ Device detection test failed: {e}")
        return "cpu"

def test_run_detection():
    """Test the existing run detection logic"""
    print("\n🔍 Testing run detection...")
    
    runs_dir = Path("runs/detect")
    existing_runs = []
    if runs_dir.exists():
        for run_dir in runs_dir.iterdir():
            if run_dir.is_dir() and run_dir.name.startswith("fruit-detection"):
                existing_runs.append(run_dir.name)
    
    # Sort runs to find the latest
    existing_runs.sort()
    latest_run = existing_runs[-1] if existing_runs else None
    
    if latest_run:
        print(f"✅ Found existing training run: {latest_run}")
        print(f"📁 Latest run path: runs/detect/{latest_run}")
        
        # Check if weights exist
        weights_path = Path(f"runs/detect/{latest_run}/weights")
        if weights_path.exists():
            best_pt = weights_path / "best.pt"
            last_pt = weights_path / "last.pt"
            print(f"   best.pt exists: {best_pt.exists()}")
            print(f"   last.pt exists: {last_pt.exists()}")
        else:
            print("   ❌ Weights directory not found")
    else:
        print("❌ No existing training runs found")
    
    return latest_run

def main():
    print("🧪 Training Code Test Script")
    print("=" * 40)
    
    # Test device detection
    device = test_device_detection()
    
    # Test run detection
    latest_run = test_run_detection()
    
    print("\n" + "=" * 40)
    print("📋 Summary:")
    print(f"   Device: {device}")
    print(f"   Latest run: {latest_run}")
    
    if latest_run:
        print(f"\n✅ Ready to resume training from: {latest_run}")
        print(f"   Training will use: {device}")
        print(f"   Batch size will be: {4 if device == 'cpu' else 16}")
    else:
        print("\n⚠️  No existing runs found - will start fresh training")

if __name__ == "__main__":
    main()
