# Hazer - AI-Powered Food Waste Detection System

A comprehensive food waste detection system that uses computer vision and machine learning to identify and count different types of fruits in images. The system includes both a **mock enterprise dashboard** for demonstration purposes and a **fully functional food detection engine** with real AI processing.

## Metrics (50 Epochs)

### **Final Epoch Metrics**
- Precision (B): 0.88705
- Recall (B): 0.91602
- mAP@50 (B): 0.95637
- mAP@50–95 (B): 0.79740

### **Training Loss**
- Train Box Loss: 0.58085
- Train Classification Loss: 0.30294
- Train DFL Loss: 0.93764

### **Validation Loss**
- Validation Box Loss: 0.60512
- Validation Classification Loss: 0.39619
- Validation DFL Loss: 0.94575


## 🚀 Features

### ✅ **Real Food Detection System** (Fully Functional)
- **AI-Powered Detection**: YOLOv8-based object detection trained on fruit/vegetable datasets
- **Real-time Analysis**: Instant image processing with bounding boxes and confidence scores
- **Multi-Input Support**: File upload, drag-and-drop, and live camera capture
- **Automatic Classification**: 11 food categories (apple, tangerine, pear, watermelon, durian, lemon, grape, pineapple, dragon fruit, korean melon, cantaloupe)
- **Live Camera Integration**: Direct webcam access with automatic image capture and processing
- **File Management**: Organized storage with dedicated folders for uploads and camera captures
- **Backend API**: Flask server with RESTful endpoints for image processing

### 🎭 **Mock Enterprise Dashboard** (Demonstration Only)
- **UAE Network Map**: Simulated map view of 12+ locations across 5 Emirates (mock data)
- **Interactive Pins**: Color-coded locations (green=low, yellow=medium, red=high waste)
- **Government Badges**: UAE National Food Security Strategy 2051, Ne'ma Initiative, UN SDGs
- **Analytics Charts**: Mock waste data with red-highlighted high-waste categories
- **Alert System**: Simulated notifications to food banks, delivery partners, and kitchens
- **Impact Screens**: Mock calculations showing kg saved and AED cost savings
- **Network Statistics**: Simulated real-time monitoring data

## 🏗️ Architecture

```
Frontend (React + TypeScript + Vite) ←→ Backend (Flask + YOLO) ←→ Trained Model
     ↓                                    ↓                        ↓
Multi-Input Interface                API Processing           Object Detection
     ↓                                    ↓                        ↓
• File Upload                        Model Inference          Bounding Boxes
• Drag & Drop                        Image Annotation         Class Counts
• Camera Capture                     Alert Processing         Impact Calculation
     ↓                                    ↓                        ↓
Interactive Dashboard               JSON Response           Real-time Alerts
     ↓                                    ↓                        ↓
• Network Map                       File Management         Notification System
• Analytics Charts                  Database Storage        Cost Savings Tracking
• Alert Management                  Multi-location Support  Government Reporting
```

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern UI framework with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library with Radix UI primitives
- **Recharts** - Data visualization and charting library
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### **Backend**
- **Python 3.8+** - Core programming language
- **Flask** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **YOLOv8 (Ultralytics)** - State-of-the-art object detection model
- **OpenCV** - Computer vision and image processing
- **PyTorch** - Deep learning framework
- **Pillow (PIL)** - Python imaging library
- **NumPy** - Numerical computing

### **AI/ML & Computer Vision**
- **YOLOv8** - Custom-trained object detection model
- **Custom Dataset** - Fruit/vegetable detection training data
- **Roboflow** - Dataset management and augmentation
- **OpenCV** - Image preprocessing and annotation
- **PyTorch** - Model training and inference

### **Development Tools**
- **Git** - Version control
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**

## 🛠️ Installation & Setup

### 1. Frontend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd waste-wise-hazer

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:8080`

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run setup script (automatically installs dependencies)
python setup.py

# Or manually install requirements
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The backend API will be available at `http://localhost:5000`

### 3. Model Training (Optional)

If you want to train your own model:

```bash
cd backend

# Run the training pipeline
python train_model.py
```

This will:
- Install training dependencies
- Download the fruit dataset from Roboflow
- Train a YOLOv8 model for 50 epochs
- Test the model and copy it to production

## 🎯 Usage

### **Real Food Detection System**

1. Navigate to `http://localhost:8080`
2. Click "Food Detection" in the header
3. **Upload an image** by:
   - Dragging & dropping files
   - Clicking "Choose File" 
   - Using "Take Photo" for live camera capture
4. Click "Analyze Image" to run **real AI detection**
5. View **actual results** with:
   - Real detection counts per food category
   - Annotated image with bounding boxes
   - Confidence scores for each detection
   - Individual detection details

### **Mock Dashboard** (Demonstration Only)

1. Navigate to `http://localhost:8080` (main page)
2. View the **simulated UAE Network Map** with mock locations
3. See **mock analytics charts** with sample waste data
4. Interact with **simulated alert system** (no real notifications sent)
5. Explore **mock impact calculations** and government alignment badges

### API Endpoints

- `POST /api/predict` - Upload image and get detection results
- `POST /api/camera-capture` - Capture from camera and process automatically
- `GET /api/health` - Health check and model status
- `GET /api/classes` - Get available class names

## 🔧 Configuration

### Model Path
Update the model path in `backend/app.py`:
```python
MODEL_PATH = 'models/best.pt'  # Path to your trained model
```

### Class Names
Modify the class names in `backend/app.py` to match your training data:
```python
CLASS_NAMES = [
    "Apple", "Orange", "Banana", "Grape", "Strawberry",
    "Peach", "Pear", "Kiwi", "Pineapple", "Mango"
]
```

### API Settings
Adjust server settings in `backend/app.py`:
```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

## 📊 Training Your Own Model

### 1. Dataset Preparation
- Use Roboflow for easy dataset management
- Or manually organize in Pascal VOC/COCO format
- Ensure proper labeling with bounding boxes

### 2. Training Configuration
```python
model.train(
    data="datasets/fruit-object-detection/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    patience=10
)
```

### 3. Model Evaluation
- Check training metrics in `runs/detect/fruit-detection/`
- Validate on test set
- Adjust hyperparameters as needed

## 🚨 Troubleshooting

### Common Issues

1. **Model not loading**
   - Check if `models/best.pt` exists
   - Verify model file integrity
   - Check Python dependencies

2. **CUDA/GPU issues**
   - Install PyTorch with CUDA support
   - Or use CPU-only version for testing

3. **Frontend can't connect to backend**
   - Ensure backend is running on port 5000
   - Check CORS settings
   - Verify network connectivity

4. **Image upload fails**
   - Check file size limits
   - Verify image format (JPEG, PNG)
   - Check backend logs for errors

### Debug Mode

Enable debug logging in the backend:
```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

## 📁 Project Structure

```
waste-wise-hazer/
├── src/                          # Frontend React code
│   ├── components/              # UI components
│   │   ├── CameraCapture.tsx   # Camera integration
│   │   ├── FoodAlert.tsx       # Alert system
│   │   ├── FoodWasteChart.tsx  # Analytics charts
│   │   ├── LocationMap.tsx     # UAE network map
│   │   ├── ImpactScreen.tsx    # Impact tracking
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/                   # Page components
│   │   ├── Index.tsx           # Main dashboard
│   │   └── FoodDetection.tsx   # Food detection page
│   └── App.tsx                 # Main app component
├── backend/                     # Python backend
│   ├── app.py                  # Flask API server
│   ├── requirements.txt        # Python dependencies
│   ├── setup.py               # Setup script
│   ├── train_model.py         # Training pipeline
│   ├── models/                 # Trained models
│   ├── uploads/                # Temporary uploads
│   ├── camera_captures/        # Camera images
│   └── annotated/              # Annotated images
├── package.json                # Frontend dependencies
├── CAMERA_CAPTURE_FEATURE.md   # Camera feature docs
└── README.md                   # This file
```
