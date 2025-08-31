import { Button } from "@/components/ui/button";
import { Camera, Settings, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/dashboard-hero.jpg";

export const Header = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b">
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="relative px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hazer Dashboard</h1>
              <p className="text-muted-foreground">AI-Powered Food Waste Detection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/food-detection">
              <Button variant="default" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Food Detection
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>8 cameras online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>Real-time monitoring active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>ML model accuracy: 94%</span>
          </div>
        </div>
      </div>
    </div>
  );
};