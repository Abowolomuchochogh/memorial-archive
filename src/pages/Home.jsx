import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen bg-cream-50 flex flex-col">
            {/* Hero Section */}
            <div className="relative flex-1 bg-forest-900 overflow-hidden flex items-center justify-center text-center px-4 py-20 sm:px-6 lg:px-8">
                {/* Abstract Isometric Pattern Background */}
                <div className="absolute inset-0 opacity-[0.07]">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M30 0L60 15V45L30 60L0 45V15L30 0Z" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="30" cy="30" r="8" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative max-w-4xl mx-auto space-y-8">
                    <p className="font-arabic text-xl sm:text-2xl text-cream-400 mb-2" dir="rtl" lang="ar">
                        بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-cream-100 leading-tight">
                        Kamgbunli Legacy
                        <span className="block text-2xl sm:text-3xl font-medium text-cream-200 mt-4 opacity-90">
                            Honoring Our Loved Ones
                        </span>
                    </h1>

                    <div className="bg-forest-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-forest-700/50 max-w-2xl mx-auto shadow-2xl">
                        <p className="text-cream-50 text-base sm:text-lg leading-relaxed font-light">
                            Welcome to the official memorial space for the Kamgbunli Muslim Community.
                            This platform is a digital <span className="font-semibold text-cream-300">Sadaqah Jariyah</span>, dedicated to preserving
                            the memories of our brothers and sisters who have returned to Allah ﷻ.
                            Here, we share stories, offer <span className="text-cream-300 italic">Taziyah</span>,
                            and keep their legacy alive.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link
                            to="/archive"
                            className="px-8 py-3.5 rounded-xl bg-cream-400 text-forest-900 font-bold text-lg hover:bg-cream-300 transition-colors shadow-lg hover:shadow-cream-400/20"
                        >
                            View the Tribute Wall
                        </Link>
                        {!currentUser && (
                            <Link
                                to="/signup"
                                className="px-8 py-3.5 rounded-xl bg-transparent border-2 border-cream-200 text-cream-100 font-semibold text-lg hover:bg-cream-100/10 transition-colors"
                            >
                                Register to Honor a Loved One
                            </Link>
                        )}
                        {currentUser && (
                            <Link
                                to="/upload"
                                className="px-8 py-3.5 rounded-xl bg-forest-700 text-cream-100 font-semibold text-lg hover:bg-forest-600 transition-colors shadow-lg"
                            >
                                Submit a Memorial
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Featured Quote / Mission Footer */}
            <div className="bg-forest-800 border-t border-forest-700 py-12 px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <p className="font-arabic text-2xl text-cream-400 mb-4">
                        إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                    </p>
                    <p className="text-cream-200 text-sm sm:text-base italic">
                        "Indeed, to Allah we belong and to Him we shall return." — Surah Al-Baqarah 2:156
                    </p>
                </div>
            </div>
        </div>
    );
}
