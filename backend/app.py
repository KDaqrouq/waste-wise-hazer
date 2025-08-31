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

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ANNOTATED_FOLDER = 'annotated'
MODEL_PATH = 'models/best.pt'  # Path to your trained YOLO model

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)

# Load the trained YOLO model
try:
    model = YOLO(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Using default YOLOv8n model for testing")
    model = YOLO('yolov8n.pt')

# Class names for fruit detection (adjust based on your training data)
CLASS_NAMES = [
    "Apple", "Orange", "Banana", "Grape", "Strawberry",
    "Peach", "Pear", "Kiwi", "Pineapple", "Mango"
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

if __name__ == '__main__':
    print("Starting Food Detection API...")
    print(f"Model path: {MODEL_PATH}")
    print(f"Available classes: {CLASS_NAMES}")
    app.run(host='0.0.0.0', port=5000, debug=True)

