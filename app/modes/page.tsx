"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const DEFAULT_MODES = [
    {
        id: "dev",
        name: "Dev Mode",
        icon: "💻",
        description: "For developers — preserves technical terms like API, Docker, GitHub",
        systemPrompt: `أنت مساعد متخصص في تحرير النصوص التقنية باللهجة المصرية العامية.
حافظ على اللهجة المصرية. صحح الكلمات التقنية (API, Docker, GitHub, React, etc.) باللغة الإنجليزية.
لا تضيف شرحاً، أرسل النص المحرر فقط.`,
        active: true,
        color: "#7c6ef7",
    },
    {
        id: "crypto",
        name: "Crypto Mode",
        icon: "₿",
        description: "For crypto workers — Bitcoin, Ethereum, DeFi, NFT",
        systemPrompt: `أنت مساعد متخصص في تحرير النصوص المتعلقة بالعملات الرقمية باللهجة المصرية.
حافظ على اللهجة. صحح أسماء العملات (Bitcoin, Ethereum, Solana, etc.) بالإنجليزية.
لا تضيف شرحاً، أرسل النص المحرر فقط.`,
        active: false,
        color: "#f5a623",
    },
    {
        id: "general",
        name: "General Mode",
        icon: "🎯",
        description: "For everyday use — punctuation and clarity improvements only",
        systemPrompt: `أنت مساعد متخصص في تحرير النصوص المنطوقة باللهجة المصرية العامية.
حافظ على اللهجة المصرية. أضف علامات الترقيم. صحح الأخطاء الإملائية الواضحة فقط.
لا تضيف شرحاً.`,
        active: false,
        color: "#3ecf6b",
    },
];

export default function ModesPage() {
    const { t } = useLanguage();

    const [modes, setModes] = useState(DEFAULT_MODES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMode, setNewMode] = useState({ name: "", description: "", systemPrompt: "", icon: "🎯", color: "#7c6ef7" });

    const setActive = (id: string) => {
        setModes((prev) => prev.map((m) => ({ ...m, active: m.id === id })));
    };

    const deleteMode = (id: string) => {
        setModes((prev) => prev.filter((m) => m.id !== id));
    };

    const addMode = () => {
        if (!newMode.name.trim()) return;
        setModes((prev) => [
            ...prev,
            { ...newMode, id: Date.now().toString(), active: false },
        ]);
        setNewMode({ name: "", description: "", systemPrompt: "", icon: "🎯", color: "#7c6ef7" });
        setShowAddModal(false);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("modesTitle")}</h1>
                    <p className="page-subtitle">{t("modesSubtitle")}</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={15} />
                    {t("newModeBtn")}
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {modes.map((mode, i) => (
                    <motion.div
                        key={mode.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="card"
                        style={{
                            borderColor: mode.active ? `${mode.color}50` : "var(--border)",
                            background: mode.active ? `color-mix(in srgb, ${mode.color} 5%, var(--bg-card))` : "var(--bg-card)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                            {/* Icon */}
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    background: `${mode.color}20`,
                                    border: `1px solid ${mode.color}30`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    flexShrink: 0,
                                }}
                            >
                                {mode.icon}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                    <span style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                                        {mode.name}
                                    </span>
                                    {mode.active && <span className="badge badge-success">{t("activeLabel")}</span>}
                                </div>
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-ui)", lineHeight: 1.6 }}>
                                    {mode.description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                                {!mode.active && (
                                    <button
                                        className="btn-ghost"
                                        style={{ padding: "7px 14px", fontSize: "12px" }}
                                        onClick={() => setActive(mode.id)}
                                    >
                                        {t("activateBtn")}
                                    </button>
                                )}
                                {mode.active && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontSize: "12px", fontWeight: "600", fontFamily: "var(--font-ui)" }}>
                                        <Check size={14} />
                                        {t("activeLabel")}
                                    </div>
                                )}
                                <button
                                    className="btn-ghost"
                                    style={{ padding: "7px 10px" }}
                                    onClick={() => deleteMode(mode.id)}
                                >
                                    <Trash2 size={13} style={{ color: "var(--danger)" }} />
                                </button>
                            </div>
                        </div>

                        {/* System prompt preview */}
                        <div
                            style={{
                                marginTop: "14px",
                                padding: "10px 12px",
                                background: "rgba(0,0,0,0.3)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <div className="section-label" style={{ marginBottom: "6px" }}>{t("promptLabel")}</div>
                            <p
                                style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                    direction: "rtl",
                                }}
                            >
                                {mode.systemPrompt.slice(0, 120)}...
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Mode Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 100,
                        }}
                        onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-xl)",
                                padding: "28px",
                                width: "500px",
                                maxWidth: "90vw",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h2 style={{ fontSize: "17px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                                    {t("modalNewMode")}
                                </h2>
                                <button className="btn-ghost" style={{ padding: "6px 8px" }} onClick={() => setShowAddModal(false)}>
                                    <X size={14} />
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 0 }}>
                                    <label className="section-label" style={{ display: "block", marginBottom: "6px" }}>{t("iconLabel")}</label>
                                    <input value={newMode.icon} onChange={e => setNewMode(p => ({ ...p, icon: e.target.value }))} style={{ width: "60px", textAlign: "center", fontSize: "20px" }} maxLength={2} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="section-label" style={{ display: "block", marginBottom: "6px" }}>{t("nameLabel")}</label>
                                    <input value={newMode.name} onChange={e => setNewMode(p => ({ ...p, name: e.target.value }))} placeholder={t("namePlaceholder")} />
                                </div>
                            </div>

                            <div>
                                <label className="section-label" style={{ display: "block", marginBottom: "6px" }}>{t("descriptionLabel")}</label>
                                <input value={newMode.description} onChange={e => setNewMode(p => ({ ...p, description: e.target.value }))} placeholder={t("descriptionPlaceholder")} />
                            </div>

                            <div>
                                <label className="section-label" style={{ display: "block", marginBottom: "6px" }}>{t("promptLabel")}</label>
                                <textarea
                                    value={newMode.systemPrompt}
                                    onChange={e => setNewMode(p => ({ ...p, systemPrompt: e.target.value }))}
                                    placeholder="System prompt for the LLM..."
                                    style={{ height: "120px", resize: "vertical", direction: "rtl", fontFamily: "'Cairo', sans-serif" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button className="btn-ghost" onClick={() => setShowAddModal(false)}>{t("cancelBtn")}</button>
                                <button className="btn-primary" onClick={addMode}>
                                    <Plus size={14} />
                                    {t("addBtn")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
