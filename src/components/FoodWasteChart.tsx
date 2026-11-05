import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStats } from "@/hooks/use-backend";

// SVG fill attributes can't read CSS variables, so this mirrors --primary from index.css
const BAR_COLOR = "hsl(142, 71%, 45%)";

export const FoodWasteChart = () => {
  const { data, isLoading, isError } = useStats();
  const chartData = Object.entries(data?.class_totals ?? {}).map(([name, count]) => ({ name, count }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Detections by Fruit</CardTitle>
        <CardDescription>
          Total items detected per fruit type across all analyzed images
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[350px] w-full" />}
        {isError && (
          <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground text-center px-6">
            The detection server is offline. Start the backend to see real detection data.
          </div>
        )}
        {data && chartData.length === 0 && (
          <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground">
            No detections yet. Analyze an image on the Food Detection page to fill this chart.
          </div>
        )}
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" name="Items detected" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
