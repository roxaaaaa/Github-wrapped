"use client";

import { motion } from "framer-motion";

interface TimelineProps {
    repoName: string;
    createdAt: string;
    lastUpdated: string;
    daysSinceUpdate: number;
    createdAtTimestamp: number;
    updatedAtTimestamp: number;
}

export function RepoTimeline({ repoName, createdAt, lastUpdated, daysSinceUpdate, createdAtTimestamp, updatedAtTimestamp }: TimelineProps) {
    const today = Date.now();
    const totalLifespan = today - createdAtTimestamp;
    const activePeriod = updatedAtTimestamp - createdAtTimestamp;
    const gapPeriod = today - updatedAtTimestamp;
    const activePercentage = (activePeriod / totalLifespan) * 100;
    const gapPercentage = (gapPeriod / totalLifespan) * 100;

    const isAbandoned = daysSinceUpdate > 180;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col items-center justify-center px-4"
        >
            <div className="w-full max-w-2xl">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#FAFAFA] mb-2">{repoName}</h3>
                    <div className="flex flex-col gap-2 text-sm text-[#A3A3A3]">
                        <div>Created: <span className="text-[#FAFAFA]">{createdAt}</span></div>
                        <div>Last Updated: <span className="text-[#FAFAFA]">{lastUpdated}</span></div>
                        <div>Days Since Update: <span className={isAbandoned ? "text-[#EF4444]" : "text-[#FAFAFA]"}>{daysSinceUpdate}</span></div>
                    </div>
                </div>

                {/* Timeline Bar */}
                <div className="relative h-16 bg-[#171717] rounded-lg overflow-hidden border border-[#262626]">
                    {/* Active Period */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${activePercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
                        style={{ width: `${activePercentage}%` }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                            Active
                        </div>
                    </motion.div>

                    {/* Gap Period */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${gapPercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute right-0 top-0 h-full bg-gradient-to-r from-[#EF4444] to-[#F59E0B]"
                        style={{ width: `${gapPercentage}%`, left: `${activePercentage}%` }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                            {isAbandoned ? "Abandoned" : "Inactive"}
                        </div>
                    </motion.div>
                </div>

                {/* Timeline Markers */}
                <div className="flex justify-between mt-2 text-xs text-[#A3A3A3]">
                    <span>{createdAt}</span>
                    <span>{lastUpdated}</span>
                    <span>Today</span>
                </div>

                <p className="text-xs text-[#A3A3A3] mt-6 text-center font-light leading-relaxed">
                    We calculated the "Depreciation Rate" of active repositories. This repo represents a high initial investment followed by 
                    {isAbandoned 
                        ? ` a total cessation of activity (> 180 days), categorizing it as an "abandoned asset" in your developer portfolio.`
                        : " a period of inactivity, but not yet abandoned."
                    }
                </p>
            </div>
        </motion.div>
    );
}
