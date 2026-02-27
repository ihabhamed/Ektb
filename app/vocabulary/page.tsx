"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, BookOpen, ArrowLeftRight } from "lucide-react";
import { useTauri } from "@/hooks/useTauri";
import { useLanguage } from "@/contexts/LanguageContext";

interface VocabEntry {
    from: string;
    to: string;
}

const DEFAULT_VOCAB: VocabEntry[] = [
    { from: "بيتكوين", to: "Bitcoin" },
    { from: "ايثيريوم", to: "Ethereum" },
    { from: "سولانا", to: "Solana" },
    { from: "ريأكت", to: "React" },
    { from: "دوكر", to: "Docker" },
    { from: "جيت هاب", to: "GitHub" },
];

export default function VocabularyPage() {
    const { getConfig, saveConfig } = useTauri();
    const { t } = useLanguage();

    const [vocab, setVocab] = useState<VocabEntry[]>(DEFAULT_VOCAB);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getConfig().then((cfg: any) => {
            if (cfg?.vocabulary?.length) setVocab(cfg.vocabulary);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addRow = () => {
        setVocab((prev) => [...prev, { from: "", to: "" }]);
    };

    const deleteRow = (i: number) => {
        setVocab((prev) => prev.filter((_, idx) => idx !== i));
    };

    const updateRow = (i: number, key: "from" | "to", value: string) => {
        setVocab((prev) => prev.map((entry, idx) => idx === i ? { ...entry, [key]: value } : entry));
    };

    const handleSave = async () => {
        const cfg: any = await getConfig();
        await saveConfig({ ...cfg, vocabulary: vocab });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("vocabularyTitle")}</h1>
                    <p className="page-subtitle">{t("vocabularySubtitle")}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn-ghost" onClick={addRow}>
                        <Plus size={14} />
                        {t("addVocab")}
                    </button>
                    <button className="btn-primary" onClick={handleSave}>
                        <Save size={14} />
                        {saved ? t("savedBtn2") : t("saveBtn")}
                    </button>
                </div>
            </div>

            {/* Info card */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    background: "rgba(124,110,247,0.08)",
                    border: "1px solid rgba(124,110,247,0.2)",
                    borderRadius: "var(--radius-md)",
                }}
            >
                <BookOpen size={16} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-ui)", lineHeight: 1.6 }}>
                    {t("vocabInfoText")}
                </p>
            </div>

            {/* Table header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 40px 1fr 40px",
                    gap: "10px",
                    padding: "0 4px",
                    alignItems: "center",
                }}
            >
                <span className="section-label">{t("spokenColumn")}</span>
                <span></span>
                <span className="section-label">{t("outputColumn")}</span>
                <span></span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <AnimatePresence>
                    {vocab.map((entry, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 40px 1fr 40px",
                                gap: "10px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                value={entry.from}
                                onChange={(e) => updateRow(i, "from", e.target.value)}
                                placeholder={t("spokenPlaceholder")}
                                dir="rtl"
                                style={{ fontFamily: "'Cairo', sans-serif" }}
                            />
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <ArrowLeftRight size={14} style={{ color: "var(--text-muted)" }} />
                            </div>
                            <input
                                value={entry.to}
                                onChange={(e) => updateRow(i, "to", e.target.value)}
                                placeholder="e.g. Bitcoin"
                            />
                            <button
                                className="btn-ghost"
                                style={{ padding: "8px 10px", justifyContent: "center" }}
                                onClick={() => deleteRow(i)}
                            >
                                <Trash2 size={13} style={{ color: "var(--danger)" }} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {vocab.length === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "60px",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        fontFamily: "var(--font-ui)",
                    }}
                >
                    {t("vocabEmpty")}
                </div>
            )}
        </div>
    );
}
