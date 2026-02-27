"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    Home,
    Layers,
    BookOpen,
    Settings,
    History,
    Mic,
    MicOff,
    Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
    isRecording?: boolean;
    status?: string;
}

export default function Sidebar({ isRecording = false, status }: SidebarProps) {
    const pathname = usePathname();
    const { t, dir } = useLanguage();

    const NAV_ITEMS = [
        { href: "/", label: t("navHome"), icon: Home },
        { href: "/modes", label: t("navModes"), icon: Layers },
        { href: "/vocabulary", label: t("navVocabulary"), icon: BookOpen },
        { href: "/history", label: t("navHistory"), icon: History },
        { href: "/config", label: t("navSettings"), icon: Settings },
    ];

    return (
        <aside
            style={{
                width: "var(--sidebar-width)",
                minWidth: "var(--sidebar-width)",
                height: "100vh",
                background: "var(--bg-secondary)",
                borderInlineEnd: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                padding: "20px 12px",
                gap: "4px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background glow accent */}
            <div
                style={{
                    position: "absolute",
                    top: "-60px",
                    insetInlineStart: "-60px",
                    width: "200px",
                    height: "200px",
                    background: "radial-gradient(circle, rgba(124,110,247,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* Logo */}
            <div style={{ padding: "8px 12px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        background: "linear-gradient(135deg, var(--accent), #a78bfa)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                    }}
                >
                    ✍️
                </div>
                <div>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("appName")}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "500" }}>
                        {t("appTagline")}
                    </div>
                </div>
            </div>

            {/* Nav label */}
            <div style={{ padding: "0 12px 8px" }}>
                <span className="section-label">{t("navMenu")}</span>
            </div>

            {/* Nav Items */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                    return (
                        <Link key={href} href={href} style={{ textDecoration: "none" }}>
                            <motion.div
                                whileHover={{ x: dir === "ltr" ? 2 : -2 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px 12px",
                                    borderRadius: "var(--radius-md)",
                                    background: isActive ? "rgba(124,110,247,0.12)" : "transparent",
                                    borderInlineStart: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                                    marginInlineStart: "-2px",
                                    cursor: "pointer",
                                    transition: "background 0.15s",
                                }}
                            >
                                <Icon
                                    size={16}
                                    style={{ color: isActive ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }}
                                />
                                <span
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: isActive ? "600" : "400",
                                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                        fontFamily: "var(--font-ui)",
                                    }}
                                >
                                    {label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        style={{ marginInlineStart: "auto" }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Status section at bottom */}
            <div
                style={{
                    padding: "12px",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    marginTop: "auto",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div
                        style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: isRecording ? "rgba(244,86,78,0.2)" : "rgba(62,207,107,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {isRecording ? (
                            <Mic size={12} style={{ color: "var(--danger)" }} />
                        ) : (
                            <MicOff size={12} style={{ color: "var(--success)" }} />
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                            {isRecording ? t("statusRecordingActive") : t("statusReady")}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
                            {status}
                        </div>
                    </div>
                    {isRecording && <span className="status-dot recording" style={{ marginInlineStart: "auto" }} />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Zap size={10} style={{ color: "var(--accent)" }} />
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
                        {t("hotkeyHint")}
                    </span>
                </div>
            </div>
        </aside>
    );
}
