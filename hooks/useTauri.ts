"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ProcessingStatus = "idle" | "recording" | "transcribing" | "refining" | "injecting" | "done" | "error";

export function useTauri() {
    const { t } = useLanguage();

    const translateError = (msg: string): string => {
        if (!msg) return t("errorUnknown");
        const m = msg.toLowerCase();
        if (m.includes("no groq api key") || m.includes("api key"))
            return t("errorNoApiKey");
        if (m.includes("no audio captured") || m.includes("no audio"))
            return t("errorNoAudio");
        if (m.includes("no speech detected") || m.includes("no speech"))
            return t("errorNoSpeech");
        if (m.includes("not currently recording"))
            return t("errorNotRecording");
        if (m.includes("already recording"))
            return t("errorAlreadyRecording");
        if (m.includes("invalid hotkey") || m.includes("فشل تسجيل الاختصار") || m.includes("صيغة الاختصار"))
            return msg;
        if (m.includes("network") || m.includes("connection") || m.includes("timeout"))
            return t("errorNetwork");
        if (m.includes("unauthorized") || m.includes("401") || m.includes("invalid_api_key"))
            return t("errorUnauthorized");
        if (m.includes("rate limit") || m.includes("429"))
            return t("errorRateLimit");
        return msg;
    };

    const [isTauri, setIsTauri] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState<ProcessingStatus>("idle");
    const [lastTranscription, setLastTranscription] = useState("");
    const [rawError, setRawError] = useState<string | null>(null);

    useEffect(() => {
        const tauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
        setIsTauri(tauri);
        if (!tauri) return;

        let cleanupFns: Array<() => void> = [];

        const setupListeners = async () => {
            const { listen } = await import("@tauri-apps/api/event");

            cleanupFns.push(
                await listen("recording-started", () => {
                    setIsRecording(true);
                    setStatus("recording");
                    setRawError(null);
                })
            );

            cleanupFns.push(
                await listen("recording-stopped", () => {
                    setIsRecording(false);
                })
            );

            cleanupFns.push(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await listen("processing-status", (e: any) => {
                    setStatus(e.payload as ProcessingStatus);
                })
            );

            cleanupFns.push(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await listen("transcription-complete", (e: any) => {
                    setLastTranscription(e.payload as string);
                    setStatus("done");
                    setTimeout(() => setStatus("idle"), 3000);
                })
            );

            cleanupFns.push(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await listen("error", (e: any) => {
                    setRawError(e.payload as string);
                    setStatus("error");
                    setIsRecording(false);
                    setTimeout(() => {
                        setStatus("idle");
                        setRawError(null);
                    }, 6000);
                })
            );
        };

        setupListeners();
        return () => {
            cleanupFns.forEach((fn) => fn());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const invoke = useCallback(
        async (cmd: string, args?: Record<string, unknown>) => {
            if (!isTauri) return null;
            const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
            return tauriInvoke(cmd, args);
        },
        [isTauri]
    );

    const startRecording = useCallback(async () => {
        await invoke("start_recording");
    }, [invoke]);

    const stopAndProcess = useCallback(async () => {
        await invoke("stop_and_process");
    }, [invoke]);

    const getConfig = useCallback(async () => {
        return invoke("get_config");
    }, [invoke]);

    const saveConfig = useCallback(
        async (config: unknown) => {
            await invoke("save_config_cmd", { config });
        },
        [invoke]
    );

    const getHistory = useCallback(async () => {
        const result = await invoke("get_history");
        return (result ?? []) as unknown[];
    }, [invoke]);

    const clearHistory = useCallback(async () => {
        await invoke("clear_history");
    }, [invoke]);

    const deleteHistoryEntry = useCallback(
        async (id: string) => {
            await invoke("delete_history_entry", { id });
        },
        [invoke]
    );

    const getMicName = useCallback(async () => {
        const name = await invoke("get_mic_name");
        return (name ?? "") as string;
    }, [invoke]);

    const statusLabel: Record<ProcessingStatus, string> = {
        idle: t("statusIdle"),
        recording: t("statusRecording"),
        transcribing: t("statusTranscribing"),
        refining: t("statusRefining"),
        injecting: t("statusInjecting"),
        done: t("statusDone"),
        error: t("statusError"),
    };

    return {
        isTauri,
        isRecording,
        status,
        statusLabel: statusLabel[status],
        lastTranscription,
        error: rawError ? translateError(rawError) : null,
        startRecording,
        stopAndProcess,
        getConfig,
        saveConfig,
        getHistory,
        clearHistory,
        deleteHistoryEntry,
        getMicName,
    };
}
