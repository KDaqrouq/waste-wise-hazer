import { Button } from "@/components/ui/button";
import { Camera, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import heroImage from "@/assets/dashboard-hero.jpg";
import { useHealth } from "@/hooks/use-backend";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/food-detection", label: "Food Detection", icon: Camera },
];

export const Header = () => {
  const health = useHealth();
  const model = health.data?.model;
  const online = health.isSuccess;
  const { pathname } = useLocation();

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hazer Dashboard</h1>
              <p className="text-muted-foreground">AI-Powered Food Waste Detection</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Button key={to} asChild variant={pathname === to ? "default" : "outline"} size="sm">
                <Link to={to} aria-current={pathname === to ? "page" : undefined}>
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${online ? "bg-success animate-pulse" : health.isLoading ? "bg-muted-foreground" : "bg-destructive"}`} />
            <span>
              {health.isLoading ? "Connecting to detection server..." : online ? "Detection server online" : "Detection server offline"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${model && !model.custom ? "bg-warning" : "bg-accent"}`} />
            <span>
              {model ? `Model: ${model.source} · ${model.class_names.length} classes` : "Model: unknown"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>
              {model?.metrics
                ? `Validation mAP50: ${(model.metrics.map50 * 100).toFixed(1)}%`
                : "Validation mAP50: not available"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
