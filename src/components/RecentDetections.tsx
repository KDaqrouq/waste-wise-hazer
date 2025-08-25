import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock } from "lucide-react";

const mockDetections = [
  {
    id: 1,
    item: "Half apple",
    location: "Kitchen Bin A",
    time: "2 minutes ago",
    confidence: 94,
  },
  {
    id: 2,
    item: "Bread slice",
    location: "Cafeteria Bin B",
    time: "5 minutes ago",
    confidence: 87,
  },
  {
    id: 3,
    item: "Leftover salad",
    location: "Kitchen Bin C",
    time: "12 minutes ago",
    confidence: 91,
  },
  {
    id: 4,
    item: "Banana peel",
    location: "Office Bin A",
    time: "18 minutes ago",
    confidence: 96,
  },
  {
    id: 5,
    item: "Pizza crust",
    location: "Kitchen Bin A",
    time: "25 minutes ago",
    confidence: 89,
  },
];

export const RecentDetections = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Recent Detections
        </CardTitle>
        <CardDescription>
          Latest food waste items detected by Hazer cameras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockDetections.map((detection) => (
            <div key={detection.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{detection.item}</span>
                  <Badge variant="secondary" className="text-xs">
                    {detection.confidence}%
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {detection.time} • {detection.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};