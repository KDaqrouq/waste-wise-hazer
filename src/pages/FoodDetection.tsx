import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Camera, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";

interface DetectionResult {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

interface ApiResponse {
  success: boolean;
  detections: DetectionResult[];
  annotated_image_url?: string;
  total_detections: number;
  class_counts: Record<string, number>;
}

const classNames = [
  "🍎 apple", "🍊 tangerine", "🍐 pear", "🍉 watermelon", "🥑 durian",
  "🍋 lemon", "🍇 grape", "🍍 pineapple", "🐉 dragon fruit", "🍈 korean melon", "🍈 cantaloupe"
];

const FoodDetection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
        setResults(null);
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setError("Please select an image file");
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setResults(data);
        toast({
          title: "Detection successful!",
          description: `Found ${data.total_detections} food items`,
        });
      } else {
        throw new Error("Detection failed");
      }
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

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Food Detection</h1>
          <p className="text-muted-foreground">
            Upload a food image to detect and count different types of fruits and vegetables
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Select or drag & drop an image to analyze
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
                      <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Analyze Image
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Reset
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag & drop an image here, or click to select
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}
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
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {results && (
              <>
                {/* Detection Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detection Results</CardTitle>
                    <CardDescription>
                      Found {results.total_detections} food items
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(results.class_counts).map(([className, count]) => (
                        <div key={className} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{className}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Annotated Image */}
                {results.annotated_image_url && (
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
                )}

                {/* Detailed Detections */}
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
                              {classNames[detection.class_id] || `Class ${detection.class_id}`}
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
                      Upload a clear image of fruits or vegetables
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
                      View results with bounding boxes and counts
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetection;


