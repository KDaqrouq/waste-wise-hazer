import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, Camera, AlertCircle, CameraIcon, SearchX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import CameraCapture from "@/components/CameraCapture";
import FoodAlert from "@/components/FoodAlert";
import { api, fruitLabel, type DetectionResponse } from "@/lib/api";
import { backendKeys, useHealth } from "@/hooks/use-backend";

// Alert thresholds for each food type
const alertThresholds: Record<string, number> = {
  "apple": 5,
  "tangerine": 4,
  "pear": 3,
  "watermelon": 2,
  "durian": 2,
  "lemon": 6,
  "grape": 8,
  "pineapple": 3,
  "dragon fruit": 2,
  "korean melon": 2,
  "cantaloupe": 2
};

const DEFAULT_CONFIDENCE = 0.25;
const percent = (value: number) => `${Math.round(value * 100)}%`;

const FoodDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [confidence, setConfidence] = useState(DEFAULT_CONFIDENCE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const health = useHealth();

  // Free the previous preview's memory whenever it changes or the page unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectImage = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setResults(null);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const rejectFile = () => {
    setError("Please select an image file");
    toast({
      title: "Invalid file type",
      description: "Please select an image file (JPEG, PNG, etc.)",
      variant: "destructive",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) selectImage(file);
    else rejectFile();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) selectImage(file);
    else rejectFile();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const analyze = async (file: File, source: "upload" | "camera") => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.detect(file, confidence, source);
      setResults(data);
      queryClient.invalidateQueries({ queryKey: backendKeys.stats });
      queryClient.invalidateQueries({ queryKey: backendKeys.history });
      toast({
        title: source === "camera" ? "Image captured and analyzed!" : "Detection successful!",
        description: `Found ${data.total_detections} food item${data.total_detections === 1 ? "" : "s"}${
          data.saved_as ? `. Photo saved to camera_captures.` : ""
        }`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Detection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }
    analyze(selectedFile, "upload");
  };

  const handleCameraCapture = (imageFile: File) => {
    selectImage(imageFile);
    analyze(imageFile, "camera");
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Only offer analysis when it would give a new answer: no result yet, or the threshold moved
  const thresholdChanged = results !== null && Math.abs(results.confidence_threshold - confidence) > 0.001;
  const showAnalyzeButton = results === null || thresholdChanged;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Food Detection</h1>
          <p className="text-muted-foreground">
            Upload a food image to detect and count different types of fruit
          </p>
        </div>

        {health.data && !health.data.model.custom && (
          <div className="mb-6 flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            <span>
              The server is running the generic <strong>{health.data.model.source}</strong>, not the trained fruit
              model, so labels won't be fruit. Run <code>python setup.py</code> in the backend folder to download
              the trained model, then restart the server.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Upload or Capture Image
              </CardTitle>
              <CardDescription>
                Select an image file, drag & drop, or capture from camera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  previewUrl
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-64 object-contain mx-auto rounded"
                    />
                    <div className="flex gap-2 justify-center">
                      {showAnalyzeButton && (
                        <Button onClick={handleSubmit} disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Camera className="mr-2 h-4 w-4" />
                              {thresholdChanged ? `Re-analyze at ${percent(confidence)}` : "Analyze Image"}
                            </>
                          )}
                        </Button>
                      )}
                      {!showAnalyzeButton && isLoading && (
                        <Button disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </Button>
                      )}
                      <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                        {results ? "New Image" : "Reset"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag & drop an image here, or choose an option below
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                        <Button
                          onClick={() => setShowCamera(true)}
                          className="flex items-center gap-2"
                        >
                          <CameraIcon className="h-4 w-4" />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="confidence" className="font-medium">Confidence threshold</label>
                  <span className="text-muted-foreground">{percent(confidence)}</span>
                </div>
                <Slider
                  id="confidence"
                  min={0.05}
                  max={0.95}
                  step={0.05}
                  value={[confidence]}
                  onValueChange={([value]) => setConfidence(value)}
                  aria-label="Confidence threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Lower finds more items but adds false positives. Higher keeps only confident detections.
                </p>
              </div>

              <div className="hidden">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {results && results.total_detections === 0 && (
              <Card>
                <CardContent className="py-10 text-center space-y-3">
                  <SearchX className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="font-medium">No fruit found in this image</p>
                  <p className="text-sm text-muted-foreground">
                    Try a clearer, well-lit photo, or lower the confidence threshold (currently{" "}
                    {percent(results.confidence_threshold)}) and re-analyze.
                  </p>
                </CardContent>
              </Card>
            )}

            {results && results.total_detections > 0 && (
              <>
                {/* Detection Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detection Results</CardTitle>
                    <CardDescription>
                      Found {results.total_detections} food item{results.total_detections === 1 ? "" : "s"} in{" "}
                      {results.processing_time.toFixed(2)}s at {percent(results.confidence_threshold)} confidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(results.class_counts).map(([className, count]) => {
                        const threshold = alertThresholds[className.toLowerCase()] || 10;
                        const isHighQuantity = count >= threshold;

                        return (
                          <div key={className} className="flex justify-between items-center">
                            <span className={`text-sm font-medium ${isHighQuantity ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {fruitLabel(className)}
                            </span>
                            <Badge
                              variant={isHighQuantity ? "destructive" : "secondary"}
                              className={isHighQuantity ? "bg-red-500 hover:bg-red-600" : ""}
                            >
                              {count}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Food Alerts */}
                {Object.entries(results.class_counts).map(([className, count]) => {
                  const threshold = alertThresholds[className.toLowerCase()] || 10;
                  if (count >= threshold) {
                    return (
                      <FoodAlert
                        key={`alert-${results.id}-${className}`}
                        className={className}
                        count={count}
                        threshold={threshold}
                      />
                    );
                  }
                  return null;
                })}
              </>
            )}

            {results && (
              <>
                {/* Annotated Image */}
                <Card>
                  <CardHeader>
                    <CardTitle>Annotated Image</CardTitle>
                    <CardDescription>
                      Image with detection bounding boxes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={results.annotated_image_url}
                      alt="Annotated detection results"
                      className="w-full rounded border"
                    />
                  </CardContent>
                </Card>

                {/* Detailed Detections */}
                {results.total_detections > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Detections</CardTitle>
                      <CardDescription>
                        Individual detection results with confidence scores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.detections.map((detection, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                            <div>
                              <span className="font-medium">
                                {fruitLabel(detection.class_name)}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                Confidence: {(detection.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Badge variant="outline">
                              Box {index + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Instructions */}
            {!results && (
              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                  <CardDescription>
                    Get started with food detection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a clear image of fruit, or take a photo
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our AI model will detect and count each item
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      View results with bounding boxes and counts. Every analysis is added to the dashboard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onImageCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default FoodDetection;
