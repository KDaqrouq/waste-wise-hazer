import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface Location {
  id: string;
  name: string;
  type: 'restaurant' | 'cafeteria' | 'hotel' | 'office';
  city: string;
  wasteLevel: 'low' | 'medium' | 'high';
  wasteAmount: number;
  status: 'active' | 'maintenance' | 'offline';
  lastUpdate: string;
  coordinates: { x: number; y: number };
}

const mockLocations: Location[] = [
  // Dubai locations
  { id: '1', name: 'Burj Al Arab Kitchen', type: 'hotel', city: 'Dubai', wasteLevel: 'high', wasteAmount: 15.2, status: 'active', lastUpdate: '2 min ago', coordinates: { x: 45, y: 25 } },
  { id: '2', name: 'Dubai Mall Food Court', type: 'restaurant', city: 'Dubai', wasteLevel: 'medium', wasteAmount: 8.7, status: 'active', lastUpdate: '5 min ago', coordinates: { x: 50, y: 30 } },
  { id: '3', name: 'Emirates Tower Cafeteria', type: 'cafeteria', city: 'Dubai', wasteLevel: 'low', wasteAmount: 3.1, status: 'active', lastUpdate: '1 min ago', coordinates: { x: 48, y: 28 } },
  { id: '4', name: 'Palm Jumeirah Resort', type: 'hotel', city: 'Dubai', wasteLevel: 'high', wasteAmount: 18.5, status: 'active', lastUpdate: '3 min ago', coordinates: { x: 42, y: 35 } },
  
  // Abu Dhabi locations
  { id: '5', name: 'Sheikh Zayed Mosque Canteen', type: 'cafeteria', city: 'Abu Dhabi', wasteLevel: 'low', wasteAmount: 2.8, status: 'active', lastUpdate: '4 min ago', coordinates: { x: 25, y: 20 } },
  { id: '6', name: 'Yas Island Hotel', type: 'hotel', city: 'Abu Dhabi', wasteLevel: 'medium', wasteAmount: 9.3, status: 'active', lastUpdate: '6 min ago', coordinates: { x: 30, y: 25 } },
  { id: '7', name: 'ADNOC Headquarters', type: 'office', city: 'Abu Dhabi', wasteLevel: 'low', wasteAmount: 4.2, status: 'active', lastUpdate: '2 min ago', coordinates: { x: 28, y: 18 } },
  
  // Sharjah locations
  { id: '8', name: 'Sharjah University Cafeteria', type: 'cafeteria', city: 'Sharjah', wasteLevel: 'medium', wasteAmount: 7.9, status: 'active', lastUpdate: '3 min ago', coordinates: { x: 35, y: 15 } },
  { id: '9', name: 'Al Qasba Restaurant', type: 'restaurant', city: 'Sharjah', wasteLevel: 'high', wasteAmount: 12.4, status: 'maintenance', lastUpdate: '1 hour ago', coordinates: { x: 38, y: 12 } },
  
  // Ajman locations
  { id: '10', name: 'Ajman Corniche Hotel', type: 'hotel', city: 'Ajman', wasteLevel: 'low', wasteAmount: 5.6, status: 'active', lastUpdate: '5 min ago', coordinates: { x: 40, y: 8 } },
  
  // Ras Al Khaimah locations
  { id: '11', name: 'RAK Mall Food Court', type: 'restaurant', city: 'Ras Al Khaimah', wasteLevel: 'medium', wasteAmount: 6.8, status: 'active', lastUpdate: '4 min ago', coordinates: { x: 55, y: 5 } },
  { id: '12', name: 'Jebel Jais Resort', type: 'hotel', city: 'Ras Al Khaimah', wasteLevel: 'low', wasteAmount: 3.9, status: 'offline', lastUpdate: '2 hours ago', coordinates: { x: 58, y: 2 } },
];

const getWasteColor = (level: string) => {
  switch (level) {
    case 'low': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'high': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600';
    case 'maintenance': return 'text-yellow-600';
    case 'offline': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <TrendingDown className="h-3 w-3" />;
    case 'maintenance': return <AlertTriangle className="h-3 w-3" />;
    case 'offline': return <TrendingUp className="h-3 w-3" />;
    default: return null;
  }
};

export const LocationMap = () => {
  const totalLocations = mockLocations.length;
  const activeLocations = mockLocations.filter(loc => loc.status === 'active').length;
  const highWasteLocations = mockLocations.filter(loc => loc.wasteLevel === 'high').length;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          UAE Network Status
        </CardTitle>
        <CardDescription>
          Real-time monitoring across {totalLocations} locations in the UAE
        </CardDescription>
        
        {/* UAE Government & UN Initiative Badges */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-full text-xs">
            <span className="text-lg">🇦🇪</span>
            <span className="font-medium text-blue-700 dark:text-blue-300">UAE National Food Security Strategy 2051</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-full text-xs">
            <span className="text-lg">🌱</span>
            <span className="font-medium text-green-700 dark:text-green-300">Ne'ma Initiative</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-full text-xs">
            <span className="text-lg">🌍</span>
            <span className="font-medium text-purple-700 dark:text-purple-300">UN SDGs (2, 11, 12, 13)</span>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Waste ({mockLocations.filter(loc => loc.wasteLevel === 'low').length})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Medium ({mockLocations.filter(loc => loc.wasteLevel === 'medium').length})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Waste ({highWasteLocations})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 h-80 overflow-hidden">
          {/* UAE Map Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-10">🇦🇪</div>
          </div>
          
          {/* Location Pins */}
          {mockLocations.map((location) => (
            <div
              key={location.id}
              className="absolute group cursor-pointer"
              style={{
                left: `${location.coordinates.x}%`,
                top: `${location.coordinates.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Pin */}
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${getWasteColor(location.wasteLevel)} relative`}>
                {/* Pulse animation for high waste */}
                {location.wasteLevel === 'high' && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">{location.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{location.type} • {location.city}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Waste Level:</span>
                    <Badge 
                      variant={location.wasteLevel === 'high' ? 'destructive' : location.wasteLevel === 'medium' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {location.wasteLevel} ({location.wasteAmount}kg)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Status:</span>
                    <div className={`flex items-center gap-1 text-xs ${getStatusColor(location.status)}`}>
                      {getStatusIcon(location.status)}
                      <span className="capitalize">{location.status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Updated {location.lastUpdate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeLocations}</div>
            <div className="text-xs text-muted-foreground">Active Locations</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{highWasteLocations}</div>
            <div className="text-xs text-muted-foreground">High Waste Alerts</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalLocations}</div>
            <div className="text-xs text-muted-foreground">Total Network</div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold">Recent Alerts</h4>
          {mockLocations
            .filter(loc => loc.wasteLevel === 'high')
            .slice(0, 3)
            .map((location) => (
              <div key={location.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{location.name}</span>
                </div>
                <span className="text-red-600 dark:text-red-400">{location.wasteAmount}kg waste</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
