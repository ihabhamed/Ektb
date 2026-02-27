"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
    icon: ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: number; // +/- percent
    accentColor?: string;
    delay?: number;
}

export default function StatsCard({
    icon,
    title,
    value,
    subtitle,
    trend,
    accentColor = "var(--accent)",
    delay = 0,
}: StatsCardProps) {
    const isPositive = trend !== undefined && trend >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="card"
            style={{ position: "relative", overflow: "hidden", cursor: "default" }}
        >
            {/* Subtle glow in top-left */}
            <div
                style={{
                    position: "absolute",
                    top: "-20px",
                    right: "-20px",
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
                    pointerEvents: "none",
                }}
            />

            {/* Top row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                    style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: `${accentColor}18`,
                        border: `1px solid ${accentColor}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accentColor,
                    }}
                >
                    {icon}
                </div>

                {trend !== undefined && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: isPositive ? "var(--success)" : "var(--danger)",
                        }}
                    >
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            {/* Value */}
            <div>
                <div
                    style={{
                        fontSize: "28px",
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                        marginBottom: "6px",
                    }}
                >
                    {value}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
                    {title}
                </div>
                {subtitle && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {subtitle}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
