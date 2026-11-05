import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CameraOff, RotateCcw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onImageCapture: (imageFile: File) => void;
  onClose: () => void;
}

const CameraCapture = ({ onImageCapture, onClose }: CameraCaptureProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Start the camera while it's switched on, and restart it when the facing mode changes.
  // The cleanup stops the stream, including one that arrives after the modal has closed.
  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    let mediaStream: MediaStream | null = null;
    setError(null);
    setIsCapturing(true);

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      .then((result) => {
        mediaStream = result;
        if (cancelled) {
          result.getTracks().forEach(track => track.stop());
          return;
        }
        setStream(result);
        if (videoRef.current) {
          videoRef.current.srcObject = result;
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
        setError(errorMessage);
        toast({
          title: "Camera error",
          description: errorMessage,
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setIsCapturing(false);
      });

    const video = videoRef.current;
    return () => {
      cancelled = true;
      mediaStream?.getTracks().forEach(track => track.stop());
      setStream(null);
      if (video) {
        video.srcObject = null;
      }
    };
  }, [cameraOn, facingMode, toast]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `camera-capture-${timestamp}.jpg`, { type: 'image/jpeg' });

        // Hand the photo to the page (which analyzes it) and close; unmounting stops the camera
        onImageCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [onImageCapture, onClose]);

  const toggleCamera = useCallback(() => {
    setCameraOn(on => !on);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </CardTitle>
          <CardDescription>
            Position your food items in the camera view and capture an image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Camera Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={toggleCamera}
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70"
              >
                {stream ? (
                  <CameraOff className="h-4 w-4" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                onClick={switchCamera}
                variant="secondary"
                size="sm"
                className="bg-black/50 hover:bg-black/70"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={captureImage}
              disabled={!stream || isCapturing}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {isCapturing ? "Starting Camera..." : "Capture Image"}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>• Make sure your food items are well-lit and clearly visible</p>
            <p>• Hold the camera steady for best results</p>
            <p>• The image will be automatically analyzed after capture</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
