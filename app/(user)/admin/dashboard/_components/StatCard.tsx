import React from "react";
import { ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendType?: "up" | "down";
}

export const StatCard = ({ title, value, trend, trendType = "up" }: StatCardProps) => (
  <Card className="border shadow-none rounded-md py-4">
    <CardHeader className="pb-2 flex items-center justify-between">
      <CardTitle className="text-sm text-slate-500 uppercase underline">
        {title}
      </CardTitle>
      <ArrowRight size={20} className="text-gray-600" />
    </CardHeader>
    <CardContent className="pt-0 flex gap-2 items-center">
      <div className="text-3xl font-semibold">{value}</div>
      <div
        className={cn(
          "flex items-center gap-1 text-xs border rounded-full px-2 h-6",
          trendType === "up"
            ? "text-green-500 border-green-500"
            : "text-red-500 border-red-500",
        )}
      >
        <ArrowUp
          size={12}
          className={cn("border rounded-full ",
            trendType === "down"
              ? "rotate-180 border-red-500"
              : "border-green-500",
          )}
        />
        {trend}
      </div>
    </CardContent>
  </Card>
);
