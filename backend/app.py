from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import os
import uuid
from PIL import Image
import io
import base64
from pathlib import Path
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ANNOTATED_FOLDER = 'annotated'
CAMERA_CAPTURES_FOLDER = 'camera_captures'
MODEL_PATH = 'models/best.pt'  # Path to your trained YOLO model

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)
os.makedirs(CAMERA_CAPTURES_FOLDER, exist_ok=True)

# Load the trained YOLO model (with fallback to latest run)
def _latest_fruit_run_dir():
    runs_dir = Path('runs') / 'detect'
    if not runs_dir.exists():
        return None
    run_dirs = [d for d in runs_dir.iterdir() if d.is_dir() and d.name.startswith('fruit-detection')]
    if not run_dirs:
        return None
    def run_index(p: Path) -> int:
        suffix = p.name.replace('fruit-detection', '')
        return int(suffix) if suffix.isdigit() else 0
    # Prefer highest numeric suffix; break ties by most recent mtime
    run_dirs.sort(key=run_index)
    return max(run_dirs, key=lambda p: p.stat().st_mtime)

def load_model_with_fallback():
    # 1) Try models/best.pt
    if os.path.exists(MODEL_PATH):
        try:
            m = YOLO(MODEL_PATH)
            print(f"Model loaded successfully from {MODEL_PATH}")
            return m
        except Exception as e:
            print(f"Primary model load failed from {MODEL_PATH}: {e}")

    # 2) Try latest run's best.pt (or last.pt)
    latest_dir = _latest_fruit_run_dir()
    if latest_dir is not None:
        best_path = latest_dir / 'weights' / 'best.pt'
        last_path = latest_dir / 'weights' / 'last.pt'
        chosen = best_path if best_path.exists() else (last_path if last_path.exists() else None)
        if chosen is not None:
            try:
                print(f"Loading model from latest run: {chosen.as_posix()}")
                m = YOLO(str(chosen))
                # Copy for future startups
                try:
                    os.makedirs('models', exist_ok=True)
                    shutil.copy2(str(chosen), MODEL_PATH)
                    print(f"Copied {chosen.as_posix()} to {MODEL_PATH}")
                except Exception as copy_err:
                    print(f"Warning: could not copy to {MODEL_PATH}: {copy_err}")
                return m
            except Exception as e:
                print(f"Fallback load from latest run failed: {e}")

    # 3) Final fallback
    print("Using default YOLOv8n model for testing (no trained model found)")
    return YOLO('yolov8n.pt')

model = load_model_with_fallback()

# Class names for fruit detection (matching data.yaml)
CLASS_NAMES = [
    "apple", "tangerine", "pear", "watermelon", "durian", 
    "lemon", "grape", "pineapple", "dragon fruit", "korean melon", "cantaloupe"
]

def draw_detections(image, detections):
    """Draw bounding boxes and labels on the image"""
    annotated_image = image.copy()
    
    for detection in detections:
        x1, y1, x2, y2 = detection['bbox']
        class_id = detection['class_id']
        confidence = detection['confidence']
        class_name = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Class {class_id}"
        
        # Draw bounding box
        cv2.rectangle(annotated_image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
        
        # Draw label background
        label = f"{class_name} {confidence:.2f}"
        (label_width, label_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.rectangle(annotated_image, (int(x1), int(y1) - label_height - 10), 
                     (int(x1) + label_width, int(y1)), (0, 255, 0), -1)
        
        # Draw label text
        cv2.putText(annotated_image, label, (int(x1), int(y1) - 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 1)
    
    return annotated_image

def process_detections(results):
    """Process YOLO detection results and extract relevant information"""
    detections = []
    class_counts = {}
    
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for i, box in enumerate(boxes):
                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                
                # Get class ID and confidence
                class_id = int(box.cls[0].cpu().numpy())
                confidence = float(box.conf[0].cpu().numpy())
                
                # Get class name
                class_name = CLASS_NAMES[class_id] if class_id < len(CLASS_NAMES) else f"Class {class_id}"
                
                # Update class counts
                if class_name not in class_counts:
                    class_counts[class_name] = 0
                class_counts[class_name] += 1
                
                # Add detection to list
                detections.append({
                    'class_id': class_id,
                    'class_name': class_name,
                    'confidence': confidence,
                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                })
    
    return detections, class_counts

@app.route('/api/predict', methods=['POST'])
def predict():
    """Handle image upload and run YOLO detection"""
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No image file selected'}), 400
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save uploaded image
        file.save(filepath)
        
        # Load image for processing
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image file'}), 400
        
        # Run YOLO detection
        results = model(image)
        
        # Process detection results
        detections, class_counts = process_detections(results)
        
        # Draw detections on image
        annotated_image = draw_detections(image, detections)
        
        # Save annotated image
        annotated_filename = f"annotated_{filename}"
        annotated_filepath = os.path.join(ANNOTATED_FOLDER, annotated_filename)
        cv2.imwrite(annotated_filepath, annotated_image)
        
        # Convert annotated image to base64 for frontend display
        with open(annotated_filepath, 'rb') as img_file:
            img_data = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Clean up uploaded file
        os.remove(filepath)
        
        # Prepare response
        response_data = {
            'success': True,
            'detections': detections,
            'annotated_image_url': f"data:image/jpeg;base64,{img_data}",
            'total_detections': len(detections),
            'class_counts': class_counts
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'class_names': CLASS_NAMES
    })

@app.route('/api/classes', methods=['GET'])
def get_classes():
    """Get available class names"""
    return jsonify({
        'classes': CLASS_NAMES,
        'total_classes': len(CLASS_NAMES)
    })

@app.route('/api/camera-capture', methods=['POST'])
def camera_capture():
    """Handle camera capture and save to specific folder"""
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No image file selected'}), 400
        
        # Generate unique filename with timestamp
        timestamp = request.form.get('timestamp', '')
        if timestamp:
            filename = f"camera_capture_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
        else:
            filename = f"camera_capture_{uuid.uuid4()}.jpg"
        
        filepath = os.path.join(CAMERA_CAPTURES_FOLDER, filename)
        
        # Save captured image
        file.save(filepath)
        
        # Load image for processing
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({'success': False, 'error': 'Invalid image file'}), 400
        
        # Run YOLO detection
        results = model(image)
        
        # Process detection results
        detections, class_counts = process_detections(results)
        
        # Draw detections on image
        annotated_image = draw_detections(image, detections)
        
        # Save annotated image
        annotated_filename = f"annotated_{filename}"
        annotated_filepath = os.path.join(ANNOTATED_FOLDER, annotated_filename)
        cv2.imwrite(annotated_filepath, annotated_image)
        
        # Convert annotated image to base64 for frontend display
        with open(annotated_filepath, 'rb') as img_file:
            img_data = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Prepare response
        response_data = {
            'success': True,
            'detections': detections,
            'annotated_image_url': f"data:image/jpeg;base64,{img_data}",
            'total_detections': len(detections),
            'class_counts': class_counts,
            'saved_path': filepath,
            'message': f'Image saved to {CAMERA_CAPTURES_FOLDER} folder'
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error during camera capture: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Food Detection API...")
    print(f"Model path: {MODEL_PATH}")
    print(f"Available classes: {CLASS_NAMES}")
    app.run(host='0.0.0.0', port=5000, debug=True)


