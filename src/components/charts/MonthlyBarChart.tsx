"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

interface MonthlyBarChartProps {
    monthlyData: Array<{ month: string; commits: number }>;
    stdDev: number;
    mean: number;
}

export function CodingSeasonChart({ monthlyData, stdDev, mean }: MonthlyBarChartProps) {
    // Handle empty data
    if (!monthlyData || monthlyData.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <p className="text-[#A3A3A3] text-sm text-center">
                    No commit data available for 2025. Start coding to see your coding season!
                </p>
            </div>
        );
    }

    // Format month labels
    const formattedData = monthlyData.map(item => ({
        ...item,
        monthLabel: new Date(item.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }));

    const isConsistent = mean > 0 && stdDev / mean < 0.5;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col items-center justify-center"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#262626" 
                        strokeOpacity={0.3}
                    />
                    <XAxis 
                        dataKey="monthLabel" 
                        tick={{ fill: "#A3A3A3", fontSize: 11 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={{ stroke: "#262626" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis 
                        tick={{ fill: "#A3A3A3", fontSize: 11 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={{ stroke: "#262626" }}
                        label={{ value: "Commits", angle: -90, position: "insideLeft", fill: "#A3A3A3", fontSize: 11 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#171717",
                            border: "1px solid #262626",
                            borderRadius: "8px",
                            color: "#FAFAFA"
                        }}
                        labelStyle={{ color: "#A3A3A3" }}
                    />
                    <ReferenceLine 
                        y={mean} 
                        stroke="#6366F1" 
                        strokeWidth={1.5}
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                    />
                    <Bar 
                        dataKey="commits" 
                        fill="#6366F1" 
                        fillOpacity={0.6}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#A3A3A3] mt-4 text-center max-w-md font-light leading-relaxed">
                This chart identifies seasonal peaks in activity. By applying a 30-day rolling average, we can see if your "Coding Season" was a sustainable trend or a short-term sprint. 
                {isConsistent 
                    ? " Your activity shows consistent patterns (low variance)."
                    : ` Your activity shows high variance (std dev: ${stdDev.toFixed(0)}), likely driven by specific project deadlines.`
                }
            </p>
        </motion.div>
    );
}
