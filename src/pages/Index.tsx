import { MetricsCard } from "@/components/MetricsCard";
import { FoodWasteChart } from "@/components/FoodWasteChart";
import { RecentDetections } from "@/components/RecentDetections";
import { Header } from "@/components/Header";
import { TrendingDown, TrendingUp, Camera, MapPin, Recycle, AlertTriangle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Total Waste Detected"
            value="47.2 kg"
            change="-12% from last week"
            changeType="positive"
            icon={Recycle}
          />
          <MetricsCard
            title="Most Wasted Item"
            value="Vegetables"
            change="25% of total waste"
            changeType="neutral"
            icon={TrendingUp}
          />
          <MetricsCard
            title="Active Cameras"
            value="8/10"
            change="2 offline for maintenance"
            changeType="warning"
            icon={Camera}
          />
          <MetricsCard
            title="Locations Monitored"
            value="5"
            change="Kitchen, Cafeteria, Office areas"
            changeType="neutral"
            icon={MapPin}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <FoodWasteChart />
          <RecentDetections />
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <TrendingDown className="h-5 w-5 text-success" />
              <h3 className="font-semibold">Waste Reduction Insights</h3>
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
