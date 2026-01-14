"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WrappedCard } from "./WrappedCard";
import { Coffee, Code, Package, Ghost, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkLifeRadarChart } from "./charts/RadarChart";
import { CommitHistogram } from "./charts/Histogram";
import { CodingSeasonChart } from "./charts/MonthlyBarChart";
import { DependencyTreemap } from "./charts/Treemap";
import { RepoTimeline } from "./charts/Timeline";

interface StoryProps {
    data: any; // Using mapped type from API
}

export function Story({ data }: StoryProps) {
    const [index, setIndex] = useState(0);

    const slides = [
        {
            id: "intro",
            title: "Welcome",
            value: data.user?.name || "Developer",
            subtext: "Here is your year in code.",
            icon: Code,
            gradient: "from-[#6366F1] to-[#818CF8]",
        },
        {
            id: "wlb",
            title: "Work-Life Balance",
            value: `${data.stats.workLifeBalance.score}%`,
            subtext: `You are a ${data.stats.workLifeBalance.label}.`,
            icon: Coffee,
            gradient: "from-[#F59E0B] to-[#EF4444]",
            chart: data.stats?.workLifeBalance?.dayOfWeekData && data.stats.workLifeBalance.dayOfWeekData.length > 0 ? (
                <WorkLifeRadarChart 
                    data={data.stats.workLifeBalance.dayOfWeekData}
                    weekendDeviation={data.stats.workLifeBalance.weekendDeviation || 0}
                />
            ) : undefined,
        },
        {
            id: "persona",
            title: "Commit Persona",
            value: data.stats.persona.title,
            subtext: data.stats.persona.description,
            icon: Code,
            gradient: "from-[#8B5CF6] to-[#EC4899]",
            chart: data.stats?.persona?.messageLengths && data.stats.persona.messageLengths.length > 0 ? (
                <CommitHistogram 
                    messageLengths={data.stats.persona.messageLengths}
                    medianLength={data.stats.persona.medianLength || 0}
                    avgLength={data.stats.persona.avgLength || 0}
                />
            ) : undefined,
        },
        {
            id: "season",
            title: "Coding Season",
            value: data.stats.codingSeason?.monthlyData?.length || 0,
            subtext: data.stats.codingSeason?.stdDev && data.stats.codingSeason.stdDev / data.stats.codingSeason.mean < 0.5
                ? "Consistent coding patterns"
                : "Burst-driven development",
            icon: Calendar,
            gradient: "from-[#3B82F6] to-[#8B5CF6]",
            chart: data.stats?.codingSeason?.monthlyData && data.stats.codingSeason.monthlyData.length > 0 ? (
                <CodingSeasonChart 
                    monthlyData={data.stats.codingSeason.monthlyData}
                    stdDev={data.stats.codingSeason.stdDev || 0}
                    mean={data.stats.codingSeason.mean || 0}
                />
            ) : undefined,
        },
        {
            id: "dependency",
            title: "Dependency Addict",
            value: data.stats.topDependency,
            subtext: "You can't live without it.",
            icon: Package,
            gradient: "from-[#10B981] to-[#059669]",
            chart: data.stats?.dependencies && data.stats.dependencies.length > 0 ? (
                <DependencyTreemap 
                    dependencies={data.stats.dependencies}
                    variance={data.stats.dependencyVariance || 1}
                />
            ) : undefined,
        },
        {
            id: "forgotten",
            title: "The One That Got Away",
            value: data.stats.forgottenRepo?.name || "None",
            subtext: data.stats.forgottenRepo
                ? `Last touched on ${data.stats.forgottenRepo.lastUpdated}`
                : "You finish everything you start!",
            icon: Ghost,
            gradient: "from-[#6B7280] to-[#4B5563]",
            chart: data.stats.forgottenRepo ? (
                <RepoTimeline 
                    repoName={data.stats.forgottenRepo.name}
                    createdAt={data.stats.forgottenRepo.createdAt}
                    lastUpdated={data.stats.forgottenRepo.lastUpdated}
                    daysSinceUpdate={data.stats.forgottenRepo.daysSinceUpdate}
                    createdAtTimestamp={data.stats.forgottenRepo.createdAtTimestamp}
                    updatedAtTimestamp={data.stats.forgottenRepo.updatedAtTimestamp}
                />
            ) : undefined,
        }
    ];

    const nextSlide = () => {
        if (index < slides.length - 1) setIndex(index + 1);
    };

    const prevSlide = () => {
        if (index > 0) setIndex(index - 1);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" && index < slides.length - 1) {
                setIndex(index + 1);
            }
            if (e.key === "ArrowLeft" && index > 0) {
                setIndex(index - 1);
            }
        };
        globalThis.addEventListener("keydown", handleKeyDown);
        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [index, slides.length]);

    return (
        <div className="fixed inset-0 bg-[#0B0B0B] text-[#FAFAFA] flex flex-col overflow-hidden">
            {/* Progress Bar */}
            <div className="flex gap-2 p-6 z-50 flex-shrink-0">
                {slides.map((_, i) => (
                    <div key={i} className="h-0.5 flex-1 bg-[#262626] rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full",
                                i <= index ? "bg-[#6366F1]" : "bg-[#262626]"
                            )}
                            initial={{ width: "0%" }}
                            animate={{ width: i < index ? "100%" : i === index ? "100%" : "0%" }}
                            transition={i === index ? { duration: 5, ease: "linear" } : { duration: 0.3 }}
                            onAnimationComplete={() => {
                                if (i === index) nextSlide();
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden">
                <div className="min-h-full flex items-center justify-center p-6 md:p-8 py-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            className="w-full max-w-4xl"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.5 }}
                        >
                            <WrappedCard {...slides[index]} />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 md:p-8 flex justify-between items-center z-50 border-t border-[#262626] bg-[#0B0B0B]/80 backdrop-blur-sm">
                <button 
                    onClick={prevSlide}
                    disabled={index === 0}
                    className={cn(
                        "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                        index === 0
                            ? "text-[#262626] cursor-not-allowed"
                            : "text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#171717] active:scale-[0.98]"
                    )}
                >
                    Back
                </button>
                <div className="text-[#262626] text-xs font-medium hidden sm:block">
                    Press Arrow Keys
                </div>
                <button 
                    onClick={nextSlide}
                    disabled={index === slides.length - 1}
                    className={cn(
                        "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                        index === slides.length - 1
                            ? "text-[#262626] cursor-not-allowed"
                            : "text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#171717] active:scale-[0.98]"
                    )}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
