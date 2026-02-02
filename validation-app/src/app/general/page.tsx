'use client';

import Header from '@/components/Header';
import ValidationForm from '@/components/ValidationForm';

export default function GeneralValidationPage() {
    return (
        <>
            <Header showBack />
            <main className="min-h-screen bg-neutral-950 text-neutral-100 pt-20 pb-12 px-4">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-10">
                    <h1 className="text-2xl font-light text-neutral-100 mb-2">
                        General Validation
                    </h1>
                    <p className="text-neutral-500 text-sm">
                        Datasets: harmless-base, helpful-base, helpful-online, helpful-rejections-sampled
                    </p>
                </div>

                {/* Validation Form */}
                <ValidationForm validatorType="general" />
            </main>
        </>
    );
}
