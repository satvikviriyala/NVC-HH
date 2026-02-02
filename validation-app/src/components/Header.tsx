import Link from 'next/link';

interface HeaderProps {
    showBack?: boolean;
}

export default function Header({ showBack = false }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-900">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showBack && (
                        <Link
                            href="/"
                            className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
                        >
                            ←
                        </Link>
                    )}
                    <Link
                        href="/"
                        className="text-lg font-light text-neutral-100 hover:text-white transition-colors tracking-tight"
                    >
                        NVC-HH
                    </Link>
                </div>
            </div>
        </header>
    );
}
