import { MetricsCard } from "@/components/MetricsCard";
import { FoodWasteChart } from "@/components/FoodWasteChart";
import { RecentDetections } from "@/components/RecentDetections";
import { LocationMap } from "@/components/LocationMap";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Camera, Apple, Target, ImageIcon, AlertTriangle } from "lucide-react";
import { useStats } from "@/hooks/use-backend";
import { fruitLabel } from "@/lib/api";

const DemoBadge = () => (
  <Badge variant="outline" className="ml-auto text-xs font-normal">Demo data</Badge>
);

const Index = () => {
  const { data: stats, isError } = useStats();
  const metrics = stats?.model.metrics;
  const todayImages = stats?.daily[stats.daily.length - 1]?.images ?? 0;
  const placeholder = isError ? "Offline" : "—";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Images Analyzed"
            value={stats ? String(stats.total_images) : placeholder}
            change={stats ? `${todayImages} today` : undefined}
            changeType="neutral"
            icon={ImageIcon}
          />
          <MetricsCard
            title="Items Detected"
            value={stats ? String(stats.total_items) : placeholder}
            change={stats && stats.total_images > 0
              ? `${(stats.total_items / stats.total_images).toFixed(1)} per image on average`
              : undefined}
            changeType="neutral"
            icon={Camera}
          />
          <MetricsCard
            title="Most Detected Item"
            value={stats?.top_class ? fruitLabel(stats.top_class) : placeholder}
            change={stats?.top_class
              ? `${stats.class_totals[stats.top_class]} of ${stats.total_items} items`
              : undefined}
            changeType="neutral"
            icon={Apple}
          />
          <MetricsCard
            title="Model Accuracy (mAP50)"
            value={metrics ? `${(metrics.map50 * 100).toFixed(1)}%` : placeholder}
            change={metrics
              ? `mAP50-95 ${(metrics.map50_95 * 100).toFixed(1)}% on the validation set`
              : stats ? "No training results found" : undefined}
            changeType={metrics ? "positive" : "warning"}
            icon={Target}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <FoodWasteChart />
          <RecentDetections />
        </div>

        {/* Network Map (mock) */}
        <div className="mb-8">
          <LocationMap />
        </div>

        {/* Additional Insights (mock) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Waste Reduction Insights</h3>
              <DemoBadge />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-sm">Vegetables waste decreased</span>
                <span className="text-sm font-medium text-success">-15%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-sm">Better portion control</span>
                <span className="text-sm font-medium text-success">+8%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-sm">Composting adoption</span>
                <span className="text-sm font-medium text-success">+22%</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Action Items</h3>
              <DemoBadge />
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-warning/10 border border-warning/20 rounded">
                <p className="text-sm font-medium">High vegetable waste in Kitchen A</p>
                <p className="text-xs text-muted-foreground mt-1">Consider staff training on portion sizes</p>
              </div>
              <div className="p-3 bg-accent/10 border border-accent/20 rounded">
                <p className="text-sm font-medium">Camera maintenance due</p>
                <p className="text-xs text-muted-foreground mt-1">Bins #3 and #7 need cleaning</p>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded">
                <p className="text-sm font-medium">Weekly report ready</p>
                <p className="text-xs text-muted-foreground mt-1">Share insights with facility managers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
