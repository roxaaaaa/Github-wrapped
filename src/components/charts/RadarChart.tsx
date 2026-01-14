"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface RadarChartProps {
    data: Array<{ day: string; commits: number }>;
    weekendDeviation: number;
}

export function WorkLifeRadarChart({ data, weekendDeviation }: RadarChartProps) {
    if (!data || data.length < 7) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <p className="text-[#A3A3A3] text-sm text-center">
                    Insufficient commit data for 2025. Make commits throughout the week to see your work-life balance!
                </p>
            </div>
        );
    }

    // Check if there's any commit data
    const totalCommits = data.reduce((sum, item) => sum + (item.commits || 0), 0);
    if (totalCommits === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <p className="text-[#A3A3A3] text-sm text-center">
                    No commits found for 2025. Start coding to see your work-life balance!
                </p>
            </div>
        );
    }

    // Normalize data against 5-day work week average
    const weekdayAvg = (data[1].commits + data[2].commits + data[3].commits + data[4].commits + data[5].commits) / 5;
    const normalizedData = data.map(item => ({
        ...item,
        normalized: weekdayAvg > 0 ? (item.commits / weekdayAvg) : 0
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col items-center justify-center"
        >
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={normalizedData}>
                    <PolarGrid 
                        stroke="#262626" 
                        strokeWidth={1}
                        strokeOpacity={0.3}
                    />
                    <PolarAngleAxis 
                        dataKey="day" 
                        tick={{ fill: "#A3A3A3", fontSize: 12, fontWeight: 500 }}
                        tickLine={{ stroke: "#262626" }}
                    />
                    <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, "dataMax + 0.5"]}
                        tick={{ fill: "#262626", fontSize: 10 }}
                        tickLine={{ stroke: "#262626" }}
                        axisLine={{ stroke: "#262626" }}
                    />
                    <Radar
                        name="Commits"
                        dataKey="normalized"
                        stroke="#6366F1"
                        fill="#6366F1"
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#A3A3A3] mt-4 text-center max-w-md font-light leading-relaxed">
                This visualization compares commit frequency across the week. By normalizing the data against a 5-day work week, we calculate the "Weekend Deviation" ({weekendDeviation.toFixed(2)}x). 
                {weekendDeviation > 1.5 && " A score > 1.5 indicates a high reliance on non-business days for project progression."}
            </p>
        </motion.div>
    );
}
