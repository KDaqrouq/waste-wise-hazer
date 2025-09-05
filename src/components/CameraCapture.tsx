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
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsCapturing(true);

      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      toast({
        title: "Camera started",
        description: "Camera is ready for capture",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      toast({
        title: "Camera error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [stream, facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

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
        // Create file from blob
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `camera-capture-${timestamp}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });

        // Call the callback with the captured image
        onImageCapture(file);

        toast({
          title: "Image captured!",
          description: "Processing image for classification...",
        });

        // Stop camera after capture
        stopCamera();
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [onImageCapture, onClose, stopCamera, toast]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [stream, startCamera, stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
  }, [facingMode]); // Restart camera when facing mode changes

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
