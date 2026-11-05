import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Clock, ImageOff, Upload } from "lucide-react";
import { useHistory } from "@/hooks/use-backend";
import { api, fruitLabel, type HistoryItem } from "@/lib/api";

const summarize = (counts: Record<string, number>) => {
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${count} ${fruitLabel(name)}`);
  return parts.length ? parts.join(", ") : "No fruit found";
};

const Thumbnail = ({ item }: { item: HistoryItem }) => {
  const [failed, setFailed] = useState(false);
  if (!item.has_image || failed) {
    return (
      <div className="h-12 w-12 shrink-0 rounded bg-muted flex items-center justify-center">
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={api.historyImageUrl(item.id)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded object-cover"
    />
  );
};

export const RecentDetections = () => {
  const { data, isLoading, isError } = useHistory(6);
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Recent Detections
        </CardTitle>
        <CardDescription>
          Latest images analyzed by the detection model
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">
            The detection server is offline, so history can't be loaded.
          </p>
        )}

        {data && items.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">No images analyzed yet.</p>
            <Button asChild size="sm">
              <Link to="/food-detection">Analyze your first image</Link>
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <Thumbnail item={item} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{summarize(item.class_counts)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                {item.source === "camera" ? <Camera className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                {item.source === "camera" ? "Camera" : "Upload"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
