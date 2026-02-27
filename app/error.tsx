"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error nicely instead of crashing the whole UI abruptly
        console.error("Ektb App Error:", error);
    }, [error]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                padding: "40px",
                textAlign: "center",
                direction: "rtl",
                fontFamily: "'Cairo', sans-serif",
            }}
        >
            <div
                style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "40px",
                    maxWidth: "400px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
            >
                <div
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(244,86,78,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--danger)",
                        marginBottom: "8px",
                    }}
                >
                    <AlertCircle size={32} />
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>
                    حدث خطأ غير متوقع
                </h2>

                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6" }}>
                    {error.message || "واجه التطبيق مشكلة تعيق العمل. يرجى المحاولة مرة أخرى."}
                </p>

                <button
                    onClick={reset}
                    className="btn-primary"
                    style={{ marginTop: "16px", width: "100%", justifyContent: "center" }}
                >
                    <RefreshCw size={16} />
                    <span>إعادة التحميل</span>
                </button>
            </div>
        </div>
    );
}
