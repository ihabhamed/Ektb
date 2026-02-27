"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Copy, Search, Clock, FileText, CheckCircle, Trash } from "lucide-react";
import { useTauri } from "@/hooks/useTauri";
import { useLanguage } from "@/contexts/LanguageContext";

interface HistoryEntry {
    id: string;
    timestamp: string;
    raw: string;
    refined: string;
    word_count: number;
}

export default function HistoryPage() {
    const { getHistory, clearHistory, deleteHistoryEntry, isTauri } = useTauri();
    const { t, lang } = useLanguage();

    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [search, setSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const refresh = async () => {
        const h = await getHistory();
        if (h) setHistory(h as HistoryEntry[]);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (isTauri) refresh(); }, [isTauri]);

    const filtered = history.filter(
        (e) =>
            e.refined?.toLowerCase().includes(search.toLowerCase()) ||
            e.raw?.toLowerCase().includes(search.toLowerCase())
    );

    const handleCopy = (entry: HistoryEntry) => {
        navigator.clipboard.writeText(entry.refined);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        await deleteHistoryEntry(id);
        setHistory((prev) => prev.filter((e) => e.id !== id));
    };

    const handleClearAll = async () => {
        await clearHistory();
        setHistory([]);
    };

    const formatDate = (ts: string) => {
        if (!ts) return "";
        try {
            const d = new Date(ts);
            return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return ts;
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("historyTitle")}</h1>
                    <p className="page-subtitle">
                        {t("historySubtitle").replace("{count}", String(history.length))}
                    </p>
                </div>
                {history.length > 0 && (
                    <button
                        className="btn-ghost"
                        onClick={handleClearAll}
                        style={{ color: "var(--danger)", borderColor: "rgba(244,86,78,0.3)" }}
                    >
                        <Trash size={13} />
                        {t("clearAll")}
                    </button>
                )}
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    style={{ paddingInlineEnd: "40px", fontFamily: "var(--font-ui)" }}
                />
                <Search
                    size={15}
                    style={{
                        position: "absolute",
                        insetInlineEnd: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                    }}
                />
            </div>

            {/* History list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <AnimatePresence>
                    {filtered.map((entry, i) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="card"
                        >
                            {/* Top row */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "10px",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Clock size={12} style={{ color: "var(--text-muted)" }} />
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-ui)" }}>
                                        {formatDate(entry.timestamp)}
                                    </span>
                                    <span className="badge badge-accent">{entry.word_count} {t("words")}</span>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        className="btn-ghost"
                                        style={{ padding: "5px 10px", fontSize: "11px" }}
                                        onClick={() => handleCopy(entry)}
                                    >
                                        {copiedId === entry.id ? (
                                            <><CheckCircle size={11} style={{ color: "var(--success)" }} /> {t("copiedBtn")}</>
                                        ) : (
                                            <><Copy size={11} /> {t("copyBtn")}</>
                                        )}
                                    </button>
                                    <button
                                        className="btn-ghost"
                                        style={{ padding: "5px 8px" }}
                                        onClick={() => handleDelete(entry.id)}
                                    >
                                        <Trash2 size={11} style={{ color: "var(--danger)" }} />
                                    </button>
                                </div>
                            </div>

                            {/* Refined text */}
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "var(--text-primary)",
                                    lineHeight: 1.8,
                                    direction: "rtl",
                                    fontFamily: "'Cairo', sans-serif",
                                    marginBottom: "10px",
                                }}
                            >
                                {entry.refined}
                            </p>

                            {/* Raw text toggle */}
                            {entry.raw && entry.raw !== entry.refined && (
                                <details style={{ marginTop: "4px" }}>
                                    <summary
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                            cursor: "pointer",
                                            listStyle: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontFamily: "var(--font-ui)",
                                        }}
                                    >
                                        <FileText size={11} />
                                        {t("rawText")}
                                    </summary>
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "var(--text-muted)",
                                            direction: "rtl",
                                            fontFamily: "'Cairo', sans-serif",
                                            marginTop: "8px",
                                            padding: "8px",
                                            background: "rgba(0,0,0,0.2)",
                                            borderRadius: "var(--radius-sm)",
                                        }}
                                    >
                                        {entry.raw}
                                    </p>
                                </details>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "60px",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        fontFamily: "var(--font-ui)",
                    }}
                >
                    {search ? t("historyNoResults") : t("historyEmpty")}
                </div>
            )}
        </div>
    );
}
