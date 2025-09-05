import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Leaf, DollarSign, TrendingUp } from "lucide-react";

interface ImpactScreenProps {
  foodType: string;
  quantity: number;
  onClose: () => void;
}

const ImpactScreen = ({ foodType, quantity, onClose }: ImpactScreenProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Mock calculations for impact
  const kgSaved = Math.round(quantity * 0.7 * 10) / 10; // 70% of detected quantity
  const aedSaved = Math.round(kgSaved * 15.5 * 10) / 10; // ~15.5 AED per kg (mock rate)
  const co2Reduced = Math.round(kgSaved * 2.5 * 10) / 10; // ~2.5kg CO2 per kg food

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className={`w-full max-w-md mx-4 transform transition-all duration-500 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-400">
            Impact Achieved!
          </CardTitle>
          <CardDescription className="text-base">
            Your alert has been sent and action is being taken
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Impact Display */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {kgSaved} kg saved
            </div>
            <div className="text-2xl font-semibold text-green-700 dark:text-green-300">
              → AED {aedSaved} saved
            </div>
          </div>

          {/* Impact Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Food Waste Prevented</span>
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                {kgSaved} kg
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Cost Savings</span>
              </div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                AED {aedSaved}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">CO₂ Reduced</span>
              </div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {co2Reduced} kg
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Based on {foodType} detection of {quantity} items</p>
            <p>Estimated 70% waste reduction through early intervention</p>
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose}
            className="w-full"
            variant="default"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImpactScreen;
