"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Eye, EyeOff, Key, Keyboard, Brain, AlertCircle, CheckCircle, Mic2, ArrowUpToLine, Globe } from "lucide-react";
import { useTauri } from "@/hooks/useTauri";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lang } from "@/lib/translations";

export default function ConfigPage() {
    const { getConfig, saveConfig, isTauri } = useTauri();
    const { t, lang, setLang } = useLanguage();

    const [apiKey, setApiKey] = useState("");
    const [hotkey, setHotkey] = useState("Alt+Space");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [sttModel, setSttModel] = useState("whisper-large-v3");
    const [llmModel, setLlmModel] = useState("llama-3.3-70b-versatile");
    const [overlayPosition, setOverlayPosition] = useState<"top" | "bottom">("top");
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState<"idle" | "saving" | "done" | "error">("idle");
    const [isCapturing, setIsCapturing] = useState(false);
    const hotkeyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isTauri) return;
        getConfig().then((cfg: any) => {
            if (!cfg) return;
            setApiKey(cfg.groq_api_key || "");
            setHotkey(cfg.hotkey || "Alt+Space");
            setSystemPrompt(cfg.system_prompt || "");
            setSttModel(cfg.stt_model || "whisper-large-v3");
            setLlmModel(cfg.llm_model || "llama-3.3-70b-versatile");
            setOverlayPosition(cfg.overlay_position === "bottom" ? "bottom" : "top");
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTauri]);

    const handleSave = async () => {
        setSaved("saving");
        try {
            const cfg: any = await getConfig();
            await saveConfig({
                ...cfg,
                groq_api_key: apiKey,
                hotkey,
                stt_model: sttModel,
                llm_model: llmModel,
                overlay_position: overlayPosition,
                system_prompt: systemPrompt,
            });
            setSaved("done");
            setTimeout(() => setSaved("idle"), 3000);
        } catch {
            setSaved("error");
            setTimeout(() => setSaved("idle"), 3000);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t("settingsTitle")}</h1>
                    <p className="page-subtitle">{t("settingsSubtitle")}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saved === "saving"}
                >
                    {saved === "saving" ? (
                        <span>{t("savingBtn")}</span>
                    ) : saved === "done" ? (
                        <><CheckCircle size={14} /> {t("savedBtn")}</>
                    ) : saved === "error" ? (
                        <><AlertCircle size={14} /> {t("saveError")}</>
                    ) : (
                        <><Save size={14} /> {t("saveSettings")}</>
                    )}
                </button>
            </div>

            {/* Language Section */}
            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Globe size={15} style={{ color: "var(--accent)" }} />
                    <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("languageSection")}
                    </h2>
                </div>
                <div className="card">
                    <label className="section-label" style={{ display: "block", marginBottom: "12px" }}>
                        {t("languageLabel")}
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {(["en", "ar"] as Lang[]).map((l) => (
                            <button
                                key={l}
                                onClick={() => setLang(l)}
                                style={{
                                    flex: 1,
                                    maxWidth: "160px",
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    border: lang === l
                                        ? "1px solid var(--accent)"
                                        : "1px solid var(--border)",
                                    background: lang === l
                                        ? "rgba(124,58,237,0.15)"
                                        : "rgba(0,0,0,0.2)",
                                    color: lang === l ? "var(--accent)" : "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontFamily: l === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif",
                                    fontWeight: lang === l ? 600 : 400,
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                }}
                            >
                                {l === "en" ? "🇺🇸 " + t("languageEnglish") : "🇸🇦 " + t("languageArabic")}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* API Keys Section */}
            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Key size={15} style={{ color: "var(--accent)" }} />
                    <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("apiKeySection")}
                    </h2>
                </div>
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label className="section-label" style={{ display: "block", marginBottom: "8px" }}>
                            Groq API Key
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="gsk_..."
                                style={{
                                    paddingInlineStart: "40px",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "12px",
                                    direction: "ltr",
                                }}
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                style={{
                                    position: "absolute",
                                    insetInlineStart: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", fontFamily: "var(--font-ui)" }}>
                            {t("apiKeyHint").split("{link}")[0]}
                            <a
                                href="https://console.groq.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--accent)", textDecoration: "none" }}
                            >
                                console.groq.com
                            </a>
                            {t("apiKeyHint").split("{link}")[1]}
                        </p>
                    </div>
                </div>
            </section>

            {/* Hotkey Section */}
            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Keyboard size={15} style={{ color: "var(--accent)" }} />
                    <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("hotkeySection")}
                    </h2>
                </div>
                <div className="card">
                    <label className="section-label" style={{ display: "block", marginBottom: "8px" }}>
                        {t("hotkeyLabel")}
                    </label>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, maxWidth: "320px" }}>
                            <div
                                style={{ position: "relative", cursor: "pointer" }}
                                onClick={() => {
                                    setIsCapturing(true);
                                    hotkeyInputRef.current?.focus();
                                }}
                            >
                                <input
                                    ref={hotkeyInputRef}
                                    value={isCapturing ? "" : hotkey}
                                    readOnly
                                    onFocus={() => setIsCapturing(true)}
                                    onBlur={() => setIsCapturing(false)}
                                    onKeyDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.key === "Escape") {
                                            setIsCapturing(false);
                                            hotkeyInputRef.current?.blur();
                                            return;
                                        }
                                        const keys: string[] = [];
                                        if (e.ctrlKey) keys.push("Ctrl");
                                        if (e.altKey) keys.push("Alt");
                                        if (e.shiftKey) keys.push("Shift");
                                        if (e.metaKey) keys.push("Super");
                                        const key = e.key;
                                        if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
                                            let cleanKey: string;
                                            if (key === " ") cleanKey = "Space";
                                            else if (key.length === 1) cleanKey = key.toUpperCase();
                                            else cleanKey = key;
                                            keys.push(cleanKey);
                                            setHotkey(keys.join("+"));
                                            setIsCapturing(false);
                                            hotkeyInputRef.current?.blur();
                                        }
                                    }}
                                    placeholder={isCapturing ? "" : t("hotkeyCapturePlaceholder")}
                                    style={{
                                        width: "100%",
                                        fontFamily: "'JetBrains Mono', monospace",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        direction: "ltr",
                                        background: isCapturing ? "rgba(124,58,237,0.1)" : "rgba(0,0,0,0.2)",
                                        border: isCapturing ? "1px solid var(--accent)" : "1px solid var(--border)",
                                        transition: "border-color 0.2s, background 0.2s",
                                        outline: "none",
                                        color: isCapturing ? "transparent" : undefined,
                                    }}
                                />
                                <AnimatePresence>
                                    {isCapturing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "12px",
                                                color: "var(--accent)",
                                                fontFamily: "var(--font-ui)",
                                                pointerEvents: "none",
                                                gap: "6px",
                                            }}
                                        >
                                            <Keyboard size={12} />
                                            {t("hotkeyCaptureActive")}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "var(--font-ui)" }}>
                                {isCapturing
                                    ? t("hotkeyCancelHint")
                                    : t("hotkeyCurrentHint").replace("{hotkey}", hotkey)
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Overlay Position */}
            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <ArrowUpToLine size={15} style={{ color: "var(--accent)" }} />
                    <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("overlaySection")}
                    </h2>
                </div>
                <div className="card">
                    <label className="section-label" style={{ display: "block", marginBottom: "12px" }}>
                        {t("overlayLabel")}
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                        {(["top", "bottom"] as const).map((pos) => (
                            <button
                                key={pos}
                                onClick={() => setOverlayPosition(pos)}
                                style={{
                                    flex: 1,
                                    maxWidth: "160px",
                                    padding: "10px 16px",
                                    borderRadius: "8px",
                                    border: overlayPosition === pos
                                        ? "1px solid var(--accent)"
                                        : "1px solid var(--border)",
                                    background: overlayPosition === pos
                                        ? "rgba(124,58,237,0.15)"
                                        : "rgba(0,0,0,0.2)",
                                    color: overlayPosition === pos ? "var(--accent)" : "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontFamily: "var(--font-ui)",
                                    fontWeight: overlayPosition === pos ? 600 : 400,
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                }}
                            >
                                {pos === "top" ? t("overlayTop") : t("overlayBottom")}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Models Section */}
            <section>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Brain size={15} style={{ color: "var(--accent)" }} />
                    <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                        {t("aiSection")}
                    </h2>
                </div>
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* STT Model */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                            <Mic2 size={13} style={{ color: "var(--text-muted)" }} />
                            <label className="section-label" style={{ display: "block" }}>
                                {t("sttLabel")}
                            </label>
                        </div>
                        <select value={sttModel} onChange={(e) => setSttModel(e.target.value)}>
                            <option value="whisper-large-v3">{t("sttRecommended")}</option>
                            <option value="whisper-large-v3-turbo">{t("sttFaster")}</option>
                        </select>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "var(--font-ui)" }}>
                            {t("sttHint")}
                        </p>
                    </div>

                    {/* LLM Model */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                            <Brain size={13} style={{ color: "var(--text-muted)" }} />
                            <label className="section-label" style={{ display: "block" }}>
                                {t("llmLabel")}
                            </label>
                        </div>
                        <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)}>
                            <option value="off">{t("llmOff")}</option>

                            <optgroup label="── Llama 3.3 ──">
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile — Recommended ✦</option>
                                <option value="llama-3.3-70b-specdec">Llama 3.3 70B SpecDec</option>
                            </optgroup>

                            <optgroup label="── Llama 3.1 ──">
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant — Fast</option>
                                <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile ⚠ deprecated</option>
                            </optgroup>

                            <optgroup label="── Llama 3 ──">
                                <option value="llama3-70b-8192">Llama 3 70B — 8192 tokens</option>
                                <option value="llama3-8b-8192">Llama 3 8B — 8192 tokens</option>
                            </optgroup>

                            <optgroup label="── Llama Guard ──">
                                <option value="llama-guard-3-8b">Llama Guard 3 8B — Content Safety</option>
                            </optgroup>

                            <optgroup label="── Gemma 2 (Google) ──">
                                <option value="gemma2-9b-it">Gemma 2 9B IT</option>
                            </optgroup>

                            <optgroup label="── Mixtral (Mistral) ──">
                                <option value="mixtral-8x7b-32768">Mixtral 8x7B — 32K tokens</option>
                            </optgroup>

                            <optgroup label="── DeepSeek ──">
                                <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill Llama 70B</option>
                            </optgroup>

                            <optgroup label="── Qwen (Alibaba) ──">
                                <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B</option>
                                <option value="qwen-2.5-32b">Qwen 2.5 32B</option>
                            </optgroup>

                            <optgroup label="── Mistral ──">
                                <option value="mistral-saba-24b">Mistral Saba 24B</option>
                            </optgroup>
                        </select>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "var(--font-ui)" }}>
                            {llmModel === "off" ? t("llmHintOff") : t("llmHint")}
                        </p>
                    </div>

                    {/* System Prompt */}
                    <div>
                        <label className="section-label" style={{ display: "block", marginBottom: "8px" }}>
                            {t("systemPromptLabel")}
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder={t("systemPromptPlaceholder")}
                            style={{
                                height: "200px",
                                resize: "vertical",
                                direction: "rtl",
                                fontFamily: "'Cairo', sans-serif",
                                lineHeight: 1.8,
                            }}
                        />
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "var(--font-ui)" }}>
                            {t("systemPromptHint")}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
