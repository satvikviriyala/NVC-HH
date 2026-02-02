'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataRow, ValidatorType, DataFolder } from '@/lib/definitions';
import ChipField from './ChipField';
import { FIELD_TOOLTIPS } from './FieldTooltip';

interface ValidationFormProps {
    validatorType: ValidatorType;
    onComplete?: () => void;
}

interface ChipDecisions {
    decisions: Record<string, 'accept' | 'reject'>;
    addedItems: string[];
}

export default function ValidationForm({ validatorType, onComplete }: ValidationFormProps) {
    const [row, setRow] = useState<DataRow | null>(null);
    const [folder, setFolder] = useState<DataFolder | null>(null);
    const [remaining, setRemaining] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Observation decision
    const [observationDecision, setObservationDecision] = useState<'nonjudgmental' | 'judgmental' | null>(null);

    // Chip field decisions
    const [feelingsData, setFeelingsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });
    const [needsData, setNeedsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });
    const [explicitNeedsData, setExplicitNeedsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });
    const [implicitNeedsData, setImplicitNeedsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });
    const [explicitRequestsData, setExplicitRequestsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });
    const [implicitRequestsData, setImplicitRequestsData] = useState<ChipDecisions>({ decisions: {}, addedItems: [] });

    // Implicit intent
    const [implicitIntentDecision, setImplicitIntentDecision] = useState<'accept' | 'reject' | null>(null);
    const [implicitIntentCustom, setImplicitIntentCustom] = useState('');

    // Safety
    const [originalSafetyLabel, setOriginalSafetyLabel] = useState<'allowed' | 'disallowed' | 'ambiguous' | null>(null);
    const [safetyLabel, setSafetyLabel] = useState<'allowed' | 'disallowed' | 'ambiguous' | null>(null);
    const [safetyReason, setSafetyReason] = useState('');
    const [safetyChangeReason, setSafetyChangeReason] = useState('');

    const safetyChanged = originalSafetyLabel !== null && safetyLabel !== originalSafetyLabel;

    const fetchNextRow = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/row?type=${validatorType}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setRow(data.row);
            setFolder(data.folder);
            setRemaining(data.remaining);

            // Reset all decisions
            if (data.row) {
                setObservationDecision(null);
                setFeelingsData({ decisions: {}, addedItems: [] });
                setNeedsData({ decisions: {}, addedItems: [] });
                setExplicitNeedsData({ decisions: {}, addedItems: [] });
                setImplicitNeedsData({ decisions: {}, addedItems: [] });
                setExplicitRequestsData({ decisions: {}, addedItems: [] });
                setImplicitRequestsData({ decisions: {}, addedItems: [] });
                setImplicitIntentDecision(null);
                setImplicitIntentCustom('');
                // Pre-fill safety from source data
                const sourceSafetyLabel = data.row.safety?.label || null;
                setOriginalSafetyLabel(sourceSafetyLabel);
                setSafetyLabel(sourceSafetyLabel);
                setSafetyReason(data.row.safety?.reason || '');
                setSafetyChangeReason('');
            }
        } catch (err) {
            setError('Failed to fetch row');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [validatorType]);

    useEffect(() => {
        fetchNextRow();
    }, [fetchNextRow]);

    // Check if all required decisions have been made
    const getAcceptedItems = (original: string[], data: ChipDecisions): string[] => {
        const allItems = [...original, ...data.addedItems];
        return allItems.filter(item => data.decisions[item] === 'accept');
    };

    const isFieldComplete = (original: string[], data: ChipDecisions): boolean => {
        const allItems = [...original, ...data.addedItems];
        if (allItems.length === 0) return true; // Empty fields are OK
        return allItems.every(item => data.decisions[item] !== undefined);
    };

    const canSubmit = row && (
        observationDecision !== null &&
        isFieldComplete(row.ofnr?.feeling || [], feelingsData) &&
        isFieldComplete(row.ofnr?.need || [], needsData) &&
        isFieldComplete(row.ofnr?.explicit_need || [], explicitNeedsData) &&
        isFieldComplete(row.ofnr?.implicit_need || [], implicitNeedsData) &&
        isFieldComplete(row.ofnr?.explicit_request || [], explicitRequestsData) &&
        isFieldComplete(row.ofnr?.implicit_request || [], implicitRequestsData) &&
        implicitIntentDecision !== null &&
        safetyLabel !== null &&
        // If safety label changed, require a reason
        (!safetyChanged || safetyChangeReason.trim().length > 0)
    );

    const handleSubmit = async () => {
        if (!row || !folder || !canSubmit) return;

        setSubmitting(true);
        try {
            // Build the complete result including all original fields
            const result = {
                // ID and metadata
                id: row.id,
                folder,
                validated_at: new Date().toISOString(),
                validator_type: validatorType,

                // Original conversation data
                prompt: row.prompt,
                context: row.context,
                human_chosen_response: row.human_chosen_response,
                human_rejected_response: row.human_rejected_response,

                // Validated OFNR
                ofnr: {
                    observation: row.ofnr.observation,
                    observation_is_judgmental: observationDecision === 'judgmental',
                    feeling: getAcceptedItems(row.ofnr?.feeling || [], feelingsData),
                    need: getAcceptedItems(row.ofnr?.need || [], needsData),
                    explicit_need: getAcceptedItems(row.ofnr?.explicit_need || [], explicitNeedsData),
                    implicit_need: getAcceptedItems(row.ofnr?.implicit_need || [], implicitNeedsData),
                    explicit_request: getAcceptedItems(row.ofnr?.explicit_request || [], explicitRequestsData),
                    implicit_request: getAcceptedItems(row.ofnr?.implicit_request || [], implicitRequestsData),
                    implicit_intent: implicitIntentDecision === 'accept'
                        ? row.ofnr.implicit_intent
                        : implicitIntentCustom,
                    pseudo_feelings_detected: row.ofnr?.pseudo_feelings_detected || [],
                },

                // Include original metadata
                metadata: row.metadata,

                // Validated safety - simple structure matching source
                // If label was changed, use only the new change reason
                safety: {
                    label: safetyLabel,
                    reason: safetyChanged && safetyChangeReason
                        ? safetyChangeReason
                        : safetyReason,
                },

                // Include original quality scores
                quality: row.quality,

                // Include original flags
                flags: row.flags,
            };

            const res = await fetch('/api/row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result, folder }),
            });

            if (!res.ok) {
                throw new Error('Failed to submit');
            }

            await fetchNextRow();
        } catch (err) {
            setError('Failed to submit validation');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-neutral-600 border-t-neutral-300 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!row) {
        return (
            <div className="text-center py-20">
                <div className="mb-6">
                    <span className="text-6xl">🎉</span>
                </div>
                <h2 className="text-3xl font-light text-neutral-100 mb-4">Thank You for Participating!</h2>
                <p className="text-neutral-400 text-lg mb-2">
                    The dataset has been 100% annotated.
                </p>
                <p className="text-neutral-500">
                    Your contributions help improve NVC-aligned AI systems.
                </p>
                {onComplete && (
                    <button
                        type="button"
                        onClick={onComplete}
                        className="mt-8 px-8 py-4 bg-neutral-800 text-neutral-200 rounded border border-neutral-700 hover:bg-neutral-700 transition-colors"
                    >
                        Return Home
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-sm">
                <span className="text-neutral-500">Source: <span className="text-neutral-300">{folder}</span></span>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* Context */}
            <div className="mb-6 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Context</h3>
                <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {row.context || 'No context'}
                </pre>
            </div>

            {/* Prompt */}
            <div className="mb-6 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">User Prompt</h3>
                <p className="text-neutral-200">{row.prompt}</p>
            </div>

            {/* Responses - only show for general validation */}
            {validatorType === 'general' && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-neutral-900/50 rounded border border-emerald-900/30">
                        <h3 className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-3">Chosen Response</h3>
                        <p className="text-sm text-neutral-300">{row.human_chosen_response}</p>
                    </div>
                    <div className="p-5 bg-neutral-900/50 rounded border border-red-900/30">
                        <h3 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-3">Rejected Response</h3>
                        <p className="text-sm text-neutral-300">{row.human_rejected_response}</p>
                    </div>
                </div>
            )}

            {/* Observation */}
            <div className="mb-6 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Observation</h3>
                    <span className="text-neutral-600 text-xs cursor-help" title={FIELD_TOOLTIPS.observation}>ⓘ</span>
                    {observationDecision === null && (
                        <span className="text-xs text-amber-500 ml-2">• Required</span>
                    )}
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed">{row.ofnr.observation}</p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setObservationDecision('nonjudgmental')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all border ${observationDecision === 'nonjudgmental'
                            ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                            }`}
                    >
                        ✓ Non-judgmental
                    </button>
                    <button
                        onClick={() => setObservationDecision('judgmental')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all border ${observationDecision === 'judgmental'
                            ? 'bg-red-950/50 border-red-800 text-red-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                            }`}
                    >
                        ✗ Judgmental
                    </button>
                </div>
            </div>

            {/* OFNR Fields */}
            <div className="mb-6 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <ChipField
                    label="Feelings"
                    items={row.ofnr?.feeling || []}
                    onDecisionsChange={(decisions, addedItems) => setFeelingsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.feeling}
                />
                <ChipField
                    label="Needs"
                    items={row.ofnr?.need || []}
                    onDecisionsChange={(decisions, addedItems) => setNeedsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.need}
                />
                <ChipField
                    label="Explicit Needs"
                    items={row.ofnr?.explicit_need || []}
                    onDecisionsChange={(decisions, addedItems) => setExplicitNeedsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.explicit_need}
                />
                <ChipField
                    label="Implicit Needs"
                    items={row.ofnr?.implicit_need || []}
                    onDecisionsChange={(decisions, addedItems) => setImplicitNeedsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.implicit_need}
                />
                <ChipField
                    label="Explicit Requests"
                    items={row.ofnr?.explicit_request || []}
                    onDecisionsChange={(decisions, addedItems) => setExplicitRequestsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.explicit_request}
                />
                <ChipField
                    label="Implicit Requests"
                    items={row.ofnr?.implicit_request || []}
                    onDecisionsChange={(decisions, addedItems) => setImplicitRequestsData({ decisions, addedItems })}
                    tooltip={FIELD_TOOLTIPS.implicit_request}
                />
            </div>

            {/* Implicit Intent */}
            <div className="mb-6 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Implicit Intent</h3>
                    <span className="text-neutral-600 text-xs cursor-help" title={FIELD_TOOLTIPS.implicit_intent}>ⓘ</span>
                    {implicitIntentDecision === null && (
                        <span className="text-xs text-amber-500 ml-2">• Required</span>
                    )}
                </div>
                <p className="text-neutral-300 mb-4 leading-relaxed italic">"{row.ofnr.implicit_intent}"</p>
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => setImplicitIntentDecision('accept')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all border ${implicitIntentDecision === 'accept'
                            ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                            }`}
                    >
                        ✓ Accept
                    </button>
                    <button
                        onClick={() => setImplicitIntentDecision('reject')}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all border ${implicitIntentDecision === 'reject'
                            ? 'bg-red-950/50 border-red-800 text-red-300'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                            }`}
                    >
                        ✗ Reject & Replace
                    </button>
                </div>
                {implicitIntentDecision === 'reject' && (
                    <input
                        type="text"
                        value={implicitIntentCustom}
                        onChange={(e) => setImplicitIntentCustom(e.target.value)}
                        placeholder="Enter corrected implicit intent..."
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-neutral-500 placeholder-neutral-600"
                    />
                )}
            </div>

            {/* Safety */}
            <div className="mb-8 p-5 bg-neutral-900/50 rounded border border-neutral-800">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Safety Classification</h3>
                    <span className="text-neutral-600 text-xs cursor-help" title={FIELD_TOOLTIPS.safety_label}>ⓘ</span>
                    {originalSafetyLabel && (
                        <span className="text-xs text-neutral-600 ml-2">
                            Original: <span className="text-neutral-400">{originalSafetyLabel}</span>
                        </span>
                    )}
                    {safetyChanged && (
                        <span className="text-xs text-amber-500 ml-2">• Changed</span>
                    )}
                </div>
                <div className="flex items-center gap-3 mb-4">
                    {(['allowed', 'disallowed', 'ambiguous'] as const).map((label) => (
                        <button
                            key={label}
                            onClick={() => setSafetyLabel(label)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-all border capitalize ${safetyLabel === label
                                ? label === 'allowed'
                                    ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                                    : label === 'disallowed'
                                        ? 'bg-red-950/50 border-red-800 text-red-300'
                                        : 'bg-amber-950/50 border-amber-700 text-amber-300'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                                }`}
                        >
                            {label === originalSafetyLabel ? `${label} ✓` : label}
                        </button>
                    ))}
                </div>

                {/* Reason for changing safety label */}
                {safetyChanged && (
                    <div className="mb-4">
                        <label className="text-xs text-amber-500 block mb-2">
                            Reason for changing label *
                        </label>
                        <textarea
                            value={safetyChangeReason}
                            onChange={(e) => setSafetyChangeReason(e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-800 border border-amber-900/50 rounded text-neutral-200 focus:outline-none focus:border-amber-700 placeholder-neutral-600 resize-none"
                            rows={2}
                            placeholder="Explain why you are changing the safety classification..."
                        />
                    </div>
                )}

                <div>
                    <label className="text-xs text-neutral-500 block mb-2">
                        Reason
                        <span className="text-neutral-600 text-xs ml-1 cursor-help" title={FIELD_TOOLTIPS.safety_reason}>ⓘ</span>
                    </label>
                    <textarea
                        value={safetyReason}
                        onChange={(e) => setSafetyReason(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:outline-none focus:border-neutral-500 placeholder-neutral-600 resize-none"
                        rows={2}
                        placeholder="Explain the safety classification..."
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col items-end gap-4">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit();
                    }}
                    disabled={!canSubmit || submitting}
                    className={`px-8 py-3 font-medium rounded transition-all ${canSubmit && !submitting
                        ? 'bg-neutral-200 text-neutral-900 hover:bg-white'
                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                        }`}
                >
                    {submitting ? 'Submitting...' : canSubmit ? 'Submit & Continue' : 'Complete All Fields'}
                </button>
                <p className="text-xs text-neutral-600">
                    Submission is final. You cannot return to edit this row.
                </p>
            </div>
        </div>
    );
}
