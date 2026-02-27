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
        console.error("Ektb Global Error:", error);
    }, [error]);

    return (
        <html lang="ar" dir="rtl">
            <head>
                <title>خطأ — إكتب</title>
                <style>{`
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: #0d0d12;
                        color: #e2e2f0;
                        font-family: 'Cairo', 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 40px;
                        text-align: center;
                    }
                    .card {
                        background: #1a1a2e;
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 20px;
                        padding: 48px 40px;
                        max-width: 400px;
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 16px;
                        box-shadow: 0 24px 64px rgba(0,0,0,0.4);
                    }
                    .icon-wrap {
                        width: 72px; height: 72px;
                        border-radius: 50%;
                        background: rgba(244,86,78,0.12);
                        display: flex; align-items: center; justify-content: center;
                        color: #f4564e;
                        margin-bottom: 8px;
                    }
                    h2 { font-size: 22px; font-weight: 700; }
                    p { color: #8888a4; font-size: 13px; line-height: 1.7; }
                    .detail {
                        background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.06);
                        border-radius: 10px;
                        padding: 12px 16px;
                        width: 100%;
                        font-size: 11px;
                        color: #f4564e;
                        font-family: monospace;
                        text-align: left;
                        direction: ltr;
                        word-break: break-all;
                        max-height: 80px;
                        overflow: auto;
                    }
                    button {
                        margin-top: 8px;
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #7c3aed, #a78bfa);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: opacity 0.2s;
                    }
                    button:hover { opacity: 0.85; }
                `}</style>
            </head>
            <body>
                <div className="card">
                    <div className="icon-wrap">
                        <AlertCircle size={36} />
                    </div>
                    <h2>حدث خطأ غير متوقع</h2>
                    <p>
                        واجه التطبيق مشكلة تمنعه من العمل بشكل صحيح.<br />
                        حاول إعادة التحميل أو أغلق التطبيق وافتحه مرة أخرى.
                    </p>
                    {error?.message && (
                        <div className="detail">{error.message}</div>
                    )}
                    <button onClick={reset}>
                        <RefreshCw size={16} />
                        إعادة التحميل
                    </button>
                </div>
            </body>
        </html>
    );
}
