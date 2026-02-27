"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useTauri } from "@/hooks/useTauri";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isOverlay = pathname === "/overlay" || pathname === "/overlay/";
    const { isRecording, statusLabel } = useTauri();

    useEffect(() => {
        if (isOverlay) {
            document.documentElement.classList.add("overlay-mode");
        } else {
            document.documentElement.classList.remove("overlay-mode");
        }
    }, [isOverlay]);

    if (isOverlay) {
        return <>{children}</>;
    }

    return (
        <div className="page-layout">
            <Sidebar isRecording={isRecording} status={statusLabel} />
            <main className="page-content">{children}</main>
        </div>
    );
}
