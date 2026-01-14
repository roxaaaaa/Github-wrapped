"use client";

import { Treemap, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

interface TreemapProps {
    dependencies: Array<{ name: string; count: number }>;
    variance: number;
}

const COLORS = [
    "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
    "#3B82F6", "#A855F7", "#F43F5E", "#F97316", "#14B8A6"
];

export function DependencyTreemap({ dependencies, variance }: TreemapProps) {
    // Handle empty data
    if (!dependencies || dependencies.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <p className="text-[#A3A3A3] text-sm text-center">
                    No dependency data available. Check repositories with package.json files to see your tech stack!
                </p>
            </div>
        );
    }

    const isAddict = variance < 0.5;
    
    // Format data for treemap
    const treemapData = dependencies.map((dep, index) => ({
        name: dep.name.length > 20 ? dep.name.substring(0, 20) + "..." : dep.name,
        fullName: dep.name,
        value: dep.count,
        color: COLORS[index % COLORS.length]
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col items-center justify-center"
        >
            <ResponsiveContainer width="100%" height={300}>
                <Treemap
                    data={treemapData}
                    dataKey="value"
                    aspectRatio={4/3}
                    stroke="#262626"
                    fill="#171717"
                >
                    {treemapData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            fillOpacity={0.7}
                        />
                    ))}
                </Treemap>
            </ResponsiveContainer>
            <div className="mt-4 w-full max-w-md">
                <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {treemapData.slice(0, 5).map((dep, idx) => (
                        <div 
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium"
                            style={{ 
                                backgroundColor: `${dep.color}20`,
                                color: dep.color,
                                border: `1px solid ${dep.color}40`
                            }}
                        >
                            {dep.fullName}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-[#A3A3A3] text-center font-light leading-relaxed">
                    This treemap visualizes your technology stack footprint. By analyzing package.json files across multiple repos, we identify core dependencies. 
                    {isAddict 
                        ? " An 'Addict' is someone whose stack has low variance—showing deep specialization in specific tools."
                        : " Your stack shows good diversity across different tools."
                    }
                </p>
            </div>
        </motion.div>
    );
}
