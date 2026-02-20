import { Link } from 'react-router-dom';

export default function CommunityGuidelines() {
    return (
        <div className="min-h-screen bg-forest-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-forest-100 overflow-hidden">
                {/* Header */}
                <div className="bg-forest-900 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05]">
                        <svg width="100%" height="100%">
                            <pattern id="guidelines-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="1" fill="white" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#guidelines-pattern)" />
                        </svg>
                    </div>

                    <h1 className="font-heading text-3xl sm:text-4xl font-bold text-cream-100 mb-4 relative z-10">
                        Community Guidelines
                    </h1>
                    <p className="text-cream-200/90 text-lg relative z-10">
                        Upholding the sanctity of our digital memorial space.
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 sm:p-12 space-y-10">

                    {/* 1. Respect & Adab */}
                    <div className="flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-2xl">
                            🤝
                        </div>
                        <div>
                            <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">
                                1. Respect and Adab
                            </h2>
                            <p className="text-forest-700 leading-relaxed">
                                This platform is a digital sanctuary. All posts, comments, and messages must remain respectful and adhere to Islamic values. Avoid any language or content that could be considered offensive or inappropriate for a memorial setting.
                            </p>
                        </div>
                    </div>

                    {/* 2. Verification */}
                    <div className="flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-2xl">
                            🛡️
                        </div>
                        <div>
                            <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">
                                2. Verification
                            </h2>
                            <p className="text-forest-700 leading-relaxed">
                                All submissions are reviewed by the Kamgbunli Admin team before being published. False or misleading information regarding a deceased community member will result in immediate removal and potential account suspension.
                            </p>
                        </div>
                    </div>

                    {/* 3. Privacy */}
                    <div className="flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-2xl">
                            🔒
                        </div>
                        <div>
                            <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">
                                3. Privacy
                            </h2>
                            <p className="text-forest-700 leading-relaxed">
                                Private chats are strictly for offering condolences, sharing memories, and making inquiries. Sharing private family information or contact details outside of these secured chats without consent is prohibited.
                            </p>
                        </div>
                    </div>

                    {/* 4. Purpose */}
                    <div className="flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-2xl">
                            🤲
                        </div>
                        <div>
                            <h2 className="font-heading text-xl font-bold text-forest-900 mb-2">
                                4. Purpose
                            </h2>
                            <p className="text-forest-700 leading-relaxed">
                                This archive is intended as a <strong>Sadaqah Jariyah</strong> (continuous charity). Use it to pray for the deceased, support the grieving families, and keep the memory of our loved ones alive in a dignified manner.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-forest-50 p-8 text-center border-t border-forest-100">
                    <Link to="/" className="inline-block px-8 py-3 rounded-xl bg-forest-800 text-cream-100 font-bold hover:bg-forest-700 transition-colors shadow-md">
                        Return to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}
