"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    ReferenceLine,
    Tooltip,
} from "recharts";
import { motion } from "framer-motion";

interface HistogramProps {
    messageLengths: number[];
    medianLength: number;
    avgLength: number;
}

export function CommitHistogram({ messageLengths, medianLength, avgLength }: HistogramProps) {
    // Handle empty data
    if (!messageLengths || messageLengths.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <p className="text-[#A3A3A3] text-sm text-center">
                    No commit messages available for 2025. Make some commits to see your commit persona!
                </p>
            </div>
        );
    }

    // Create bins for histogram (0-10, 11-20, 21-30, etc.)
    const bins: Record<string, number> = {};
    const binSize = 10;
    
    messageLengths.forEach(length => {
        const bin = Math.floor(length / binSize) * binSize;
        const binKey = `${bin}-${bin + binSize - 1}`;
        bins[binKey] = (bins[binKey] || 0) + 1;
    });

    const chartData = Object.entries(bins)
        .map(([range, frequency]) => {
            const [start] = range.split("-").map(Number);
            return { range: `${start}+`, frequency, value: start + binSize / 2 };
        })
        .sort((a, b) => a.value - b.value);

    const isPoet = medianLength > 0 && avgLength / medianLength > 1.3;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col items-center justify-center"
        >
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#262626" 
                        strokeOpacity={0.3}
                    />
                    <XAxis 
                        dataKey="range" 
                        tick={{ fill: "#A3A3A3", fontSize: 11 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={{ stroke: "#262626" }}
                        label={{ value: "Characters in commit message", position: "insideBottom", offset: -5, fill: "#A3A3A3", fontSize: 11 }}
                    />
                    <YAxis 
                        tick={{ fill: "#A3A3A3", fontSize: 11 }}
                        axisLine={{ stroke: "#262626" }}
                        tickLine={{ stroke: "#262626" }}
                        label={{ value: "Frequency", angle: -90, position: "insideLeft", fill: "#A3A3A3", fontSize: 11 }}
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
                        x={Math.floor(medianLength / binSize) * binSize + binSize / 2} 
                        stroke="#6366F1" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ value: "Median", position: "top", fill: "#6366F1", fontSize: 10 }}
                    />
                    <Bar 
                        dataKey="frequency" 
                        fill="#6366F1" 
                        fillOpacity={0.6}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#A3A3A3] mt-4 text-center max-w-md font-light leading-relaxed">
                We analyzed the character length distribution of all commit messages. 
                {isPoet 
                    ? ` "The Poet" exhibits a high mean-to-median ratio (${(avgLength / medianLength).toFixed(2)}x), suggesting descriptive documentation.`
                    : ` "Chaos" shows a high frequency of low-character outliers, with a median of ${medianLength.toFixed(0)} characters.`
                }
            </p>
        </motion.div>
    );
}
