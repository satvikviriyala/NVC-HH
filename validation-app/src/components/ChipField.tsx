'use client';

import { useState, useRef, useEffect } from 'react';

interface ChipFieldProps {
    label: string;
    items: string[];
    onDecisionsChange: (decisions: Record<string, 'accept' | 'reject'>, addedItems: string[]) => void;
    tooltip?: string;
    allowAdd?: boolean;
    placeholder?: string;
}

export default function ChipField({
    label,
    items,
    onDecisionsChange,
    tooltip,
    allowAdd = true,
    placeholder = "Add new...",
}: ChipFieldProps) {
    const [decisions, setDecisions] = useState<Record<string, 'accept' | 'reject'>>({});
    const [addedItems, setAddedItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [showInput, setShowInput] = useState(false);

    // Use refs to track latest values for callback
    const decisionsRef = useRef(decisions);
    const addedItemsRef = useRef(addedItems);
    const onDecisionsChangeRef = useRef(onDecisionsChange);

    // Update refs when values change
    useEffect(() => {
        decisionsRef.current = decisions;
    }, [decisions]);

    useEffect(() => {
        addedItemsRef.current = addedItems;
    }, [addedItems]);

    useEffect(() => {
        onDecisionsChangeRef.current = onDecisionsChange;
    }, [onDecisionsChange]);

    const handleDecision = (item: string, decision: 'accept' | 'reject') => {
        const newDecisions = { ...decisionsRef.current, [item]: decision };
        setDecisions(newDecisions);
        // Call callback directly with new value
        onDecisionsChangeRef.current(newDecisions, addedItemsRef.current);
    };

    const handleAddItem = () => {
        if (newItem.trim() && !items.includes(newItem.trim()) && !addedItems.includes(newItem.trim())) {
            const trimmed = newItem.trim();
            const newAddedItems = [...addedItemsRef.current, trimmed];
            const newDecisions = { ...decisionsRef.current, [trimmed]: 'accept' as const };
            setAddedItems(newAddedItems);
            setDecisions(newDecisions);
            setNewItem('');
            setShowInput(false);
            // Call callback directly with new values
            onDecisionsChangeRef.current(newDecisions, newAddedItems);
        }
    };

    const allItems = [...items, ...addedItems];
    const allDecided = allItems.length === 0 || allItems.every(item => decisions[item] !== undefined);

    return (
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-neutral-300 uppercase tracking-wide">{label}</label>
                {tooltip && (
                    <span className="text-neutral-500 text-xs cursor-help hover:text-neutral-400 transition-colors" title={tooltip}>ⓘ</span>
                )}
                {!allDecided && allItems.length > 0 && (
                    <span className="text-xs text-amber-500 ml-2">• Pending review</span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {allItems.length === 0 && !showInput && (
                    <span className="text-neutral-600 text-sm italic">Empty</span>
                )}

                {allItems.map((item, idx) => {
                    const decision = decisions[item];
                    const isAdded = addedItems.includes(item);

                    return (
                        <div
                            key={idx}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all border ${decision === 'reject'
                                    ? 'bg-neutral-900 border-red-900/50 text-neutral-500 line-through'
                                    : decision === 'accept'
                                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                                        : 'bg-neutral-800/50 border-amber-700/50 text-neutral-200'
                                }`}
                        >
                            <span>{item}</span>
                            {isAdded && <span className="text-xs text-neutral-500">(added)</span>}
                            <div className="flex items-center gap-1 ml-1 border-l border-neutral-700 pl-2">
                                <button
                                    type="button"
                                    onClick={() => handleDecision(item, 'accept')}
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-all ${decision === 'accept'
                                            ? 'bg-emerald-700 text-white'
                                            : 'bg-neutral-800 text-neutral-500 hover:bg-emerald-900/50 hover:text-emerald-300'
                                        }`}
                                    title="Accept"
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDecision(item, 'reject')}
                                    className={`w-6 h-6 flex items-center justify-center rounded transition-all ${decision === 'reject'
                                            ? 'bg-red-800 text-white'
                                            : 'bg-neutral-800 text-neutral-500 hover:bg-red-900/50 hover:text-red-300'
                                        }`}
                                    title="Reject"
                                >
                                    ✗
                                </button>
                            </div>
                        </div>
                    );
                })}

                {allowAdd && !showInput && (
                    <button
                        type="button"
                        onClick={() => setShowInput(true)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded text-sm bg-neutral-800/50 border border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-all"
                    >
                        + Add
                    </button>
                )}

                {showInput && (
                    <div className="inline-flex items-center gap-2">
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            placeholder={placeholder}
                            className="px-3 py-2 text-sm bg-neutral-900 border border-neutral-700 rounded text-white focus:outline-none focus:border-neutral-500 placeholder-neutral-600"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-3 py-2 text-sm bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowInput(false);
                                setNewItem('');
                            }}
                            className="px-3 py-2 text-sm bg-neutral-800 text-neutral-400 rounded hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
