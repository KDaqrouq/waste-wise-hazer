# Waste Wise Hazer - AI-Powered Food Waste Detection

A comprehensive food waste detection system that uses computer vision and machine learning to identify and count different types of fruits and vegetables in images.

## 🚀 Features

- **Frontend Dashboard**: Modern React-based UI with drag-and-drop image upload
- **AI Model**: YOLOv8-based object detection trained on fruit/vegetable datasets
- **Real-time Detection**: Instant analysis with bounding boxes and confidence scores
- **Class Counting**: Automatic counting of detected food items by category
- **Annotated Results**: Visual output with detection boxes and labels

## 🏗️ Architecture

```
Frontend (React + TypeScript) ←→ Backend (Flask + YOLO) ←→ Trained Model
     ↓                              ↓                        ↓
Image Upload                    API Processing           Object Detection
     ↓                              ↓                        ↓
Drag & Drop                   Model Inference          Bounding Boxes
     ↓                              ↓                        ↓
Results Display               JSON Response           Class Counts
```

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

### Frontend Dashboard

1. Navigate to `http://localhost:8080`
2. Click "Food Detection" in the header
3. Upload an image by dragging & dropping or clicking "Choose File"
4. Click "Analyze Image" to run detection
5. View results with:
   - Detection counts per class
   - Annotated image with bounding boxes
   - Individual detection details

### API Endpoints

- `POST /api/predict` - Upload image and get detection results
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
│   └── annotated/              # Annotated images
├── package.json                # Frontend dependencies
└── README.md                   # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ultralytics](https://github.com/ultralytics/ultralytics) for YOLOv8
- [Roboflow](https://roboflow.com/) for dataset management
- [shadcn/ui](https://ui.shadcn.com/) for UI components

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review backend logs
3. Open an issue on GitHub
4. Contact the development team

---

**Happy detecting! 🍎🍌🍇**
