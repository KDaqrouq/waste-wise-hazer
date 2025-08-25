import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const mockData = [
  { name: "Vegetables", amount: 12.5, percentage: 25 },
  { name: "Fruits", amount: 8.3, percentage: 17 },
  { name: "Bread", amount: 6.7, percentage: 13 },
  { name: "Dairy", amount: 5.2, percentage: 10 },
  { name: "Meat", amount: 4.8, percentage: 9 },
  { name: "Other", amount: 12.5, percentage: 26 },
];

export const FoodWasteChart = () => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Food Waste by Category</CardTitle>
        <CardDescription>
          Weekly breakdown of wasted food items detected by cameras
        </CardDescription>
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
              fill="hsl(var(--primary))" 
              name="Amount (kg)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};