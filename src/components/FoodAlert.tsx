import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, CheckCircle, Users, Truck, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImpactScreen from "./ImpactScreen";

interface FoodAlertProps {
  className: string;
  count: number;
  threshold: number;
}

const FoodAlert = ({ className, count, threshold }: FoodAlertProps) => {
  const [isNotified, setIsNotified] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState<string[]>([]);
  const [showImpact, setShowImpact] = useState(false);
  const { toast } = useToast();

  const isHighQuantity = count >= threshold;
  
  if (!isHighQuantity) return null;

  const handleNotify = (type: string) => {
    if (!notificationsSent.includes(type)) {
      setNotificationsSent([...notificationsSent, type]);
      
      toast({
        title: "Notification Sent!",
        description: `Alert sent to ${type.toLowerCase()}`,
      });

      // Show impact screen after first notification
      if (notificationsSent.length === 0) {
        setTimeout(() => {
          setShowImpact(true);
        }, 1000);
      }
    }
  };

  const handleMarkNotified = () => {
    setIsNotified(true);
    toast({
      title: "Alert Acknowledged",
      description: "All notifications have been sent and acknowledged",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "Food Bank": return <Users className="h-4 w-4" />;
      case "Delivery Partners": return <Truck className="h-4 w-4" />;
      case "Kitchen": return <ChefHat className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <>
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          High Quantity Alert
        </CardTitle>
        <CardDescription className="text-red-600 dark:text-red-300">
          {className} count ({count}) exceeds threshold ({threshold})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Message */}
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
            ⚠️ Alert: High {className} quantity detected! Consider reducing portions or alerting distribution partners.
          </p>
        </div>

        {/* Notification Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Send alerts to:
          </p>
          <div className="flex flex-wrap gap-2">
            {["Food Bank", "Delivery Partners", "Kitchen"].map((type) => (
              <Button
                key={type}
                onClick={() => handleNotify(type)}
                disabled={notificationsSent.includes(type)}
                variant={notificationsSent.includes(type) ? "secondary" : "destructive"}
                size="sm"
                className="flex items-center gap-2"
              >
                {getNotificationIcon(type)}
                {notificationsSent.includes(type) ? "Sent" : `Alert ${type}`}
              </Button>
            ))}
          </div>
        </div>

        {/* Notified Button */}
        {notificationsSent.length > 0 && (
          <div className="pt-2 border-t border-red-200 dark:border-red-800">
            <Button
              onClick={handleMarkNotified}
              disabled={isNotified}
              variant={isNotified ? "secondary" : "default"}
              className="w-full flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isNotified ? "Notified ✓" : "Mark as Notified"}
            </Button>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={isNotified ? "secondary" : "destructive"}
            className="text-xs"
          >
            {isNotified ? "Alert Resolved" : "Alert Active"}
          </Badge>
        </div>
      </CardContent>
    </Card>

    {/* Impact Screen */}
    {showImpact && (
      <ImpactScreen
        foodType={className}
        quantity={count}
        onClose={() => setShowImpact(false)}
      />
    )}
  </>
  );
};

export default FoodAlert;
