'use client';

import Header from '@/components/Header';
import ValidationForm from '@/components/ValidationForm';

export default function LawyerValidationPage() {
    return (
        <>
            <Header showBack />
            <main className="min-h-screen bg-neutral-950 text-neutral-100 pt-20 pb-12 px-4">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-10">
                    <h1 className="text-2xl font-light text-neutral-100 mb-2">
                        Legal Review
                    </h1>
                    <p className="text-neutral-500 text-sm mb-6">
                        Dataset: red-team-attempts
                    </p>

                    {/* Warning */}
                    <div className="p-4 bg-neutral-900 border border-neutral-800 rounded">
                        <p className="text-neutral-400 text-sm">
                            <span className="text-amber-600">Note:</span> This section contains adversarial prompts
                            that may include sensitive content. Please review objectively.
                        </p>
                    </div>
                </div>

                {/* Validation Form */}
                <ValidationForm validatorType="lawyers" />
            </main>
        </>
    );
}
