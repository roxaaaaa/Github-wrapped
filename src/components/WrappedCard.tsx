"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WrappedCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon?: LucideIcon;
    gradient: string; // e.g., "from-pink-500 to-purple-600"
    delay?: number;
    chart?: React.ReactNode;
}

export function WrappedCard({ title, value, subtext, icon: Icon, gradient, delay = 0, chart }: WrappedCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "relative flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl w-full min-h-[600px] max-w-4xl mx-auto overflow-hidden",
                "bg-[#171717] border border-[#262626] shadow-soft",
                chart ? "justify-start" : "justify-center"
            )}
        >
            {/* Subtle background accent */}
            <div className={cn("absolute inset-0 opacity-[0.03] bg-gradient-to-br", gradient)} />

            {/* Minimal glow effect */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.02, 0.04, 0.02] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className={cn("absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl bg-gradient-to-r", gradient)}
            />

            <div className="relative z-10 flex flex-col items-center gap-8">
                {Icon && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: delay + 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className={cn(
                            "p-5 rounded-xl bg-gradient-to-br shadow-subtle border border-[#262626]",
                            gradient
                        )}
                    >
                        <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                )}

                <motion.h3
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.4, ease: "easeOut" }}
                    className="text-sm font-medium text-[#A3A3A3] uppercase tracking-[0.15em] letter-spacing-wide"
                >
                    {title}
                </motion.h3>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.6, type: "spring", stiffness: 150, damping: 20 }}
                    className={cn(
                        "text-5xl md:text-6xl lg:text-7xl font-semibold text-transparent bg-clip-text bg-gradient-to-r leading-tight",
                        gradient
                    )}
                >
                    {value}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.8, ease: "easeOut" }}
                    className="text-base md:text-lg text-[#A3A3A3] font-light leading-relaxed max-w-[85%]"
                >
                    {subtext}
                </motion.p>

                {chart && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delay + 1, ease: "easeOut" }}
                        className="w-full mt-8"
                    >
                        {chart}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
