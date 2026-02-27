"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type WidgetStatus =
    | "idle"
    | "recording"
    | "transcribing"
    | "refining"
    | "injecting"
    | "done"
    | "error";

const STATUS_COLOR: Record<WidgetStatus, string> = {
    idle:         "#7c3aed",
    recording:    "#4ade80",
    transcribing: "#fbbf24",
    refining:     "#a78bfa",
    injecting:    "#4ade80",
    done:         "#4ade80",
    error:        "#f87171",
};

// Number of wave bars
const BAR_COUNT = 24;

// Bell-curve: middle bars are tallest (22px), edges shortest (3px)
const barMaxHeight = (i: number, total: number): number => {
    const x = (i / (total - 1)) * 2 - 1;
    return Math.round(3 + Math.exp(-x * x * 2.8) * 18);
};

// Pre-computed bell-curve multipliers per bar (0–1 range)
const BAR_BELL = Array.from({ length: BAR_COUNT }, (_, i) => {
    const x = (i / (BAR_COUNT - 1)) * 2 - 1;
    return Math.exp(-x * x * 2.8); // 0–1
});

export default function OverlayPage() {
    const [status, setStatus] = useState<WidgetStatus>("idle");
    const [visible, setVisible] = useState(false);
    const barsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Force transparency - override globals.css dark background
        document.documentElement.style.cssText += ";background:transparent!important;background-color:transparent!important";
        document.body.style.cssText += ";background:transparent!important;background-color:transparent!important";

        // Not inside Tauri — nothing to set up
        if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

        const cleanupFns: Array<() => void> = [];

        const setup = async () => {
            try {
                const { listen } = await import("@tauri-apps/api/event");
                const { getCurrentWindow, availableMonitors } = await import("@tauri-apps/api/window");
                const { LogicalPosition } = await import("@tauri-apps/api/dpi");

                const positionWindow = async (pos?: string | null) => {
                    try {
                        const win = getCurrentWindow(); // still needed for setPosition
                        const monitors = await availableMonitors();
                        const primary = monitors[0];
                        if (!primary) return;

                        const scale = primary.scaleFactor || 1;
                        const screenW = primary.size.width / scale;
                        const screenH = primary.size.height / scale;
                        const winW = 182;
                        const winH = 54;

                        const x = Math.round((screenW - winW) / 2);
                        const y = pos === "bottom"
                            ? Math.round(screenH - winH - 48)
                            : 28;

                        await win.setPosition(new LogicalPosition(x, y));
                    } catch { /* ignore positioning errors */ }
                };

                cleanupFns.push(await listen<string>("show-overlay", async (e) => {
                    setStatus("recording");
                    setVisible(true);
                    await positionWindow(e.payload);
                }));

                cleanupFns.push(await listen("recording-started", () => {
                    setStatus("recording");
                    setVisible(true);
                }));

                cleanupFns.push(await listen("recording-stopped", () => {
                    setStatus("transcribing");
                }));

                cleanupFns.push(await listen<string>("processing-status", (e) => {
                    setStatus(e.payload as WidgetStatus);
                }));

                cleanupFns.push(await listen("transcription-complete", () => {
                    setStatus("done");
                }));

                cleanupFns.push(await listen<string>("error", () => {
                    setStatus("error");
                    setVisible(true);
                }));

                // Primary hide signal from Rust — animate out then hide the OS window
                cleanupFns.push(await listen("overlay-hide", async () => {
                    setVisible(false);
                    setStatus("idle");
                    // Small delay for exit animation to complete, then hide OS window
                    await new Promise(r => setTimeout(r, 350));
                    try { await getCurrentWindow().hide(); } catch { }
                }));

                // Read config and position window
                try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    const cfg = await invoke<{ overlay_position?: string }>("get_config");
                    await positionWindow(cfg?.overlay_position);
                } catch { }

            } catch (err) {
                console.error("[Overlay] setup failed:", err);
            }
        };

        setup();
        return () => cleanupFns.forEach(fn => fn());
    }, []);

    // Drive bar heights directly via DOM refs — zero React re-renders
    useEffect(() => {
        if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

        const isRecording = status === "recording";

        if (!isRecording) {
            // Reset all bars to a fixed static scale based on current status
            const scale = status === "done"       ? 1
                        : status === "error"      ? 0.15
                        : status === "transcribing" || status === "refining" || status === "injecting"
                                                  ? 0.45
                        : 0.08;
            barsRef.current.forEach(bar => {
                if (bar) bar.style.transform = `scaleY(${scale})`;
            });
            return;
        }

        // Recording: listen to audio-level events and update bars in real-time
        let unlisten: (() => void) | null = null;
        const setup = async () => {
            const { listen } = await import("@tauri-apps/api/event");
            unlisten = await listen<number>("audio-level", (e) => {
                // Amplify raw RMS (usually 0–0.05 for speech) into 0–1 range
                const level = Math.min(1, e.payload * 20);
                barsRef.current.forEach((bar, i) => {
                    if (!bar) return;
                    const scale = 0.05 + level * BAR_BELL[i] * 0.95;
                    bar.style.transform = `scaleY(${scale})`;
                });
            });
        };
        setup();
        return () => { unlisten?.(); };
    }, [status]);

    const color = STATUS_COLOR[status];
    const isRecording  = status === "recording";
    const isProcessing = status === "transcribing" || status === "refining" || status === "injecting";

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                userSelect: "none",
                overflow: "hidden",
                pointerEvents: "none",
            }}
            data-tauri-drag-region
        >
            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="pill"
                        initial={{ opacity: 0, scale: 0.6,  y: -12 }}
                        animate={{ opacity: 1, scale: 1,    y: 0   }}
                        exit={{   opacity: 0, scale: 0.5,   y: -12 }}
                        transition={{ type: "spring", stiffness: 520, damping: 26 }}
                        data-tauri-drag-region
                        style={{
                            pointerEvents: "auto",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            gap: "2px",
                            padding: "10px 14px",
                            background: "rgba(6, 6, 10, 0.55)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            borderRadius: "999px",
                            border: `1px solid ${color}40`,
                            boxShadow: [
                                "0 8px 32px rgba(0,0,0,0.6)",
                                `0 0 0 0.5px ${color}25`,
                                "inset 0 1px 0 rgba(255,255,255,0.08)",
                                isRecording ? `0 0 24px ${color}18` : "",
                            ].filter(Boolean).join(", "),
                            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                            animation: isProcessing ? "ektb-proc-pulse 1.4s ease-in-out infinite" : "none",
                        }}
                    >
                        {Array.from({ length: BAR_COUNT }, (_, i) => {
                            const maxH = barMaxHeight(i, BAR_COUNT);
                            return (
                                <div
                                    key={i}
                                    ref={(el) => { barsRef.current[i] = el; }}
                                    style={{
                                        width: "2px",
                                        height: `${maxH}px`,
                                        background: status === "error" ? "rgba(248,113,113,0.4)" : color,
                                        borderRadius: "2px",
                                        transformOrigin: "50% 100%",
                                        // Start flat; audio-level effect drives transform in real-time
                                        transform: "scaleY(0.08)",
                                        transition: "background 0.3s ease, transform 0.06s ease-out",
                                        flexShrink: 0,
                                    }}
                                />
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
