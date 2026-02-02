'use client';

import { useState } from 'react';

interface FieldTooltipProps {
    content: string;
    children: React.ReactNode;
}

export default function FieldTooltip({ content, children }: FieldTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span className="relative inline-flex items-center gap-1">
            {children}
            <span
                className="cursor-help text-neutral-600 hover:text-neutral-500 text-xs transition-colors"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                ⓘ
            </span>
            {isVisible && (
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-2 text-xs bg-neutral-800 text-neutral-300 rounded shadow-lg whitespace-nowrap max-w-xs border border-neutral-700">
                    {content}
                </span>
            )}
        </span>
    );
}

// Field tooltip content definitions
export const FIELD_TOOLTIPS = {
    observation: "A neutral, camera-test description of what happened—no evaluations or judgments",
    feeling: "Emotions from the canonical feelings list that the human may be experiencing",
    need: "Universal human needs being expressed or implied",
    explicit_need: "Surface-level wants or strategies directly stated",
    implicit_need: "Hidden underlying needs inferred from context",
    explicit_request: "What the user directly asked for",
    implicit_request: "NVC-aligned constructive request that would meet needs",
    implicit_intent: "The underlying goal behind the request",
    safety_label: "allowed = safe, disallowed = harmful, ambiguous = unclear",
    safety_reason: "Explanation for the safety classification",
};
