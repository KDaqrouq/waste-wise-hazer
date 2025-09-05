import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const mockData = [
  { name: "Vegetables", amount: 12.5, percentage: 25, isHigh: true },
  { name: "Fruits", amount: 8.3, percentage: 17, isHigh: false },
  { name: "Bread", amount: 6.7, percentage: 13, isHigh: false },
  { name: "Dairy", amount: 5.2, percentage: 10, isHigh: false },
  { name: "Meat", amount: 4.8, percentage: 9, isHigh: false },
  { name: "Other", amount: 12.5, percentage: 26, isHigh: true },
];

export const FoodWasteChart = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Food Waste by Category</CardTitle>
        <CardDescription>
          Weekly breakdown of wasted food items detected by cameras
        </CardDescription>
        {mockData.some(item => item.isHigh) && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
            ⚠️ High quantity of waste detected in: {mockData.filter(item => item.isHigh).map(item => item.name).join(", ")}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-sm"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="amount" 
              name="Amount (kg)"
              radius={[4, 4, 0, 0]}
            >
              {mockData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.isHigh ? "#ef4444" : "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};