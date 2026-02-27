"use client";

interface ShortcutBadgeProps {
    keys: string[];
    label?: string;
}

export default function ShortcutBadge({ keys, label }: ShortcutBadgeProps) {
    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {label && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "6px" }}>
                    {label}
                </span>
            )}
            {keys.map((key, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <kbd>{key}</kbd>
                    {i < keys.length - 1 && (
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>+</span>
                    )}
                </span>
            ))}
        </div>
    );
}
