"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Zap,
  FileText,
  Clock,
  BarChart2,
  CheckCircle,
  AlertCircle,
  Copy,
  Mic2,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import ShortcutBadge from "@/components/ShortcutBadge";
import { useTauri } from "@/hooks/useTauri";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HomePage() {
  const {
    isTauri,
    isRecording,
    status,
    statusLabel,
    lastTranscription,
    error,
    startRecording,
    stopAndProcess,
    getHistory,
    getConfig,
    getMicName,
  } = useTauri();

  const { t, lang } = useLanguage();

  const [history, setHistory] = useState<
    { id: string; timestamp: string; refined: string; word_count: number }[]
  >([]);
  const [copied, setCopied] = useState(false);
  const [hotkey, setHotkey] = useState("Alt+Space");
  const [micName, setMicName] = useState<string | null>(null);

  // Wave bars ref — updated directly from audio-level events (no re-renders)
  const waveBarsRef = useRef<(HTMLDivElement | null)[]>([]);
  const WAVE_COUNT = 20;
  // Bell-curve multipliers so center bars are taller
  const waveBell = useRef(
    Array.from({ length: WAVE_COUNT }, (_, i) => {
      const x = (i / (WAVE_COUNT - 1)) * 2 - 1;
      return Math.exp(-x * x * 2.5);
    })
  );

  useEffect(() => {
    if (!isTauri) return;
    getHistory().then((h) => {
      if (h) setHistory(h as never);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTauri, status]);

  useEffect(() => {
    if (!isTauri) return;
    getConfig().then((cfg: any) => {
      if (cfg?.hotkey) setHotkey(cfg.hotkey);
    });
    getMicName().then((name) => {
      if (name) setMicName(name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTauri]);

  // Drive wave bar heights directly via DOM refs to avoid re-renders
  useEffect(() => {
    if (!isTauri) return;

    if (!isRecording) {
      // Collapse all bars to flat when not recording
      waveBarsRef.current.forEach(bar => {
        if (bar) bar.style.transform = "scaleY(0.08)";
      });
      return;
    }

    let unlisten: (() => void) | null = null;
    const setup = async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unlisten = await listen<number>("audio-level", (e) => {
        const level = Math.min(1, e.payload * 20);
        waveBarsRef.current.forEach((bar, i) => {
          if (!bar) return;
          const scale = 0.08 + level * waveBell.current[i] * 0.92;
          bar.style.transform = `scaleY(${scale})`;
        });
      });
    };
    setup();
    return () => { unlisten?.(); };
  }, [isTauri, isRecording]);

  const hotkeyKeys = hotkey.split("+").map((k: string) => k.trim());

  const totalWords = history.reduce((a, e) => a + (e.word_count || 0), 0);
  const todaySessions = history.filter((e) => {
    const entryDate = e.timestamp?.split("T")[0] ?? "";
    const today = new Date().toISOString().split("T")[0];
    return entryDate === today;
  }).length;

  const avgWpm = history.length > 0 ? Math.round(totalWords / Math.max(history.length, 1) * 0.8) : 0;

  const copyLast = () => {
    if (lastTranscription || history[0]?.refined) {
      navigator.clipboard.writeText(lastTranscription || history[0]?.refined || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      await stopAndProcess();
    } else {
      await startRecording();
    }
  };

  const displayText = lastTranscription || history[0]?.refined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("welcomeTitle")}</h1>
          <p className="page-subtitle">
            {(() => {
              const parts = t("welcomeSubtitle").split("{hotkey}");
              return <>{parts[0]}<strong>{hotkey}</strong>{parts[1]}</>;
            })()}
          </p>
        </div>
        <ShortcutBadge keys={hotkeyKeys} />
      </div>

      {/* Mic name badge */}
      {micName && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.15)",
          borderRadius: "var(--radius-md)",
          width: "fit-content",
        }}>
          <Mic2 size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
          <span style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-ui)",
            direction: "ltr",
          }}>
            {micName}
          </span>
        </div>
      )}

      {/* Big Record Button */}
      <motion.div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "40px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-xl)",
          border: isRecording
            ? "1px solid rgba(34,197,94,0.4)"
            : "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
          cursor: "default",
        }}
        animate={{
          boxShadow: isRecording
            ? ["0 0 0px rgba(34,197,94,0)", "0 0 40px rgba(34,197,94,0.2)", "0 0 0px rgba(34,197,94,0)"]
            : "0 0 0px transparent",
        }}
        transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5 }}
      >
        {/* Record button */}
        <motion.button
          onClick={handleMicClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={isRecording ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "none",
            background: isRecording
              ? "linear-gradient(135deg, #22c55e, #34d399)"
              : "linear-gradient(135deg, var(--accent), #a78bfa)",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isRecording
              ? "0 0 30px rgba(34,197,94,0.4)"
              : "0 0 30px var(--accent-glow)",
          }}
        >
          {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
        </motion.button>

        {/* Status text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={statusLabel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ textAlign: "center" }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: isRecording ? "var(--success)" : "var(--text-primary)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {statusLabel}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-ui)" }}>
              {isRecording
                ? t("pressAgainToStop")
                : (() => {
                    const parts = t("pressToStart").split("{hotkey}");
                    return <>{parts[0]}<strong>{hotkey}</strong>{parts[1]}</>;
                  })()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Recording waveform bars — heights driven by audio-level events via DOM refs */}
        {isRecording && (
          <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "30px" }}>
            {Array.from({ length: WAVE_COUNT }).map((_, i) => {
              // Max height follows a bell curve: center bars tallest
              const maxH = Math.round(8 + waveBell.current[i] * 22);
              return (
                <div
                  key={i}
                  ref={(el) => { waveBarsRef.current[i] = el; }}
                  style={{
                    width: "3px",
                    height: `${maxH}px`,
                    background: "#22c55e",
                    borderRadius: "99px",
                    opacity: 0.8,
                    transformOrigin: "50% 100%",
                    transform: "scaleY(0.08)",
                    transition: "transform 0.06s ease-out",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "rgba(244,86,78,0.12)",
              border: "1px solid rgba(244,86,78,0.3)",
              borderRadius: "var(--radius-md)",
              color: "var(--danger)",
              fontSize: "12px",
              maxWidth: "450px",
              textAlign: "center",
              fontFamily: "var(--font-ui)",
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        <StatsCard
          icon={<Zap size={16} />}
          title={t("statsAvgWpm")}
          value={avgWpm || "—"}
          subtitle={t("statsWpmSubtitle")}
          accentColor="var(--accent)"
          trend={avgWpm > 0 ? 12 : undefined}
          delay={0.1}
        />
        <StatsCard
          icon={<FileText size={16} />}
          title={t("statsTotalWords")}
          value={totalWords > 0 ? totalWords.toLocaleString(lang === "ar" ? "ar" : "en") : "0"}
          subtitle={t("statsTotalWordsSubtitle")}
          accentColor="#3ecf6b"
          delay={0.2}
        />
        <StatsCard
          icon={<Clock size={16} />}
          title={t("statsTodaySessions")}
          value={todaySessions}
          subtitle={t("statsTodaySessionsSubtitle")}
          accentColor="#f5a623"
          delay={0.3}
        />
      </div>

      {/* Last transcription */}
      {displayText && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={14} style={{ color: "var(--success)" }} />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
                {t("lastTranscription")}
              </span>
            </div>
            <button
              className="btn-ghost"
              onClick={copyLast}
              style={{ padding: "6px 12px", fontSize: "12px" }}
            >
              <Copy size={12} />
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              lineHeight: 1.8,
              direction: "rtl",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {displayText}
          </p>
        </motion.div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <BarChart2 size={14} style={{ color: "var(--text-muted)" }} />
            <span className="section-label">{t("recentRecordings")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {history.slice(0, 3).map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    direction: "rtl",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {entry.refined}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span className="badge badge-accent">{entry.word_count} {t("words")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
