import { Link } from 'react-router-dom';
import founderImage from '../assets/image_1872a2.jpg';

export default function About() {
    return (
        <div className="min-h-screen bg-cream-50">

            {/* Hero / Header */}
            <div className="relative bg-forest-900 py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]">
                    <svg width="100%" height="100%">
                        <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="2" fill="currentColor" className="text-cream-100" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#pattern-circles)" />
                    </svg>
                </div>
                <div className="relative max-w-7xl mx-auto text-center">
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-cream-100 mb-6">
                        Our Story
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-cream-200/90 leading-relaxed">
                        From physical folders to a timeless digital legacy.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

                {/* The Vision Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div className="space-y-6 order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-100 text-forest-800 font-semibold text-sm">
                            <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse"></span>
                            The Vision
                        </div>
                        <h2 className="font-heading text-3xl font-bold text-forest-900 leading-tight">
                            Preserving History in the Digital Age
                        </h2>
                        <div className="space-y-4 text-forest-700 text-lg leading-relaxed">
                            <p>
                                For years, our community's history was kept in folders—fragments of paper and physical photos that time could easily fade. We realized that to truly honor our loved ones, we needed a space that was as accessible as it was permanent.
                            </p>
                            <p>
                                By moving from folders to this digital archive, we ensure that every member of the Kamgbunli community, whether at home or abroad, can connect with their roots, offer prayers, and keep the legacy of our ancestors alive in the modern age.
                            </p>
                        </div>
                    </div>

                    {/* Visual Graphic: Folder -> Lantern */}
                    <div className="order-1 lg:order-2 flex justify-center">
                        <div className="relative w-full max-w-md aspect-square bg-gradient-to-br from-forest-50 to-cream-100 rounded-full flex items-center justify-center p-8 border border-cream-200 shadow-inner">
                            <div className="flex items-center gap-4 sm:gap-8">
                                {/* Folder */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-cream-400 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6 transition-transform hover:rotate-0">
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-forest-800/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-heading font-semibold text-forest-800/60 text-sm">Yesterday</span>
                                </div>

                                {/* Arrow */}
                                <div className="text-forest-400 animate-pulse">
                                    <svg className="w-8 h-8 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>

                                {/* Lantern */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-forest-800 rounded-xl flex items-center justify-center shadow-xl shadow-forest-900/20 transform rotate-6 transition-transform hover:rotate-0 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-cream-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                        </svg>
                                    </div>
                                    <span className="font-heading font-bold text-forest-800 text-sm">Today & Forever</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Timeline / Transformation Section */}
                <section className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-cream-200">
                    <div className="text-center mb-12">
                        <h2 className="font-heading text-3xl font-bold text-forest-900 mb-4">The Evolution</h2>
                        <p className="text-forest-600 max-w-2xl mx-auto">
                            Transforming how we remember, share, and pray for our loved ones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-forest-100 transform -translate-x-1/2">
                            <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white border border-forest-200 rounded-full flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 text-forest-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                        </div>

                        {/* Before Card */}
                        <div className="bg-cream-50 rounded-2xl p-8 border border-cream-200 transition-all hover:shadow-md">
                            <h3 className="text-lg font-bold text-forest-800/70 mb-2 uppercase tracking-wide">The Past</h3>
                            <h4 className="font-heading text-2xl font-bold text-forest-900 mb-4">Physical Archives</h4>
                            <ul className="space-y-3 text-forest-700">
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>Documents prone to damage and loss</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>Limited accessibility for diaspora</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-red-400 mt-1">✕</span>
                                    <span>Difficult to update or share</span>
                                </li>
                            </ul>
                        </div>

                        {/* After Card */}
                        <div className="bg-forest-50/50 rounded-2xl p-8 border border-forest-100 transition-all hover:shadow-md">
                            <h3 className="text-lg font-bold text-forest-600 mb-2 uppercase tracking-wide">The Future</h3>
                            <h4 className="font-heading text-2xl font-bold text-forest-900 mb-4">Digital Sadaqah Jariyah</h4>
                            <ul className="space-y-3 text-forest-700">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>Permanently preserved in the cloud</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>Accessible globally, anytime</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span>Interactive tributes and prayers</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Heritage Transition Section */}
                <section className="relative overflow-hidden rounded-3xl border border-cream-200 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Old Paper Side */}
                        <div className="bg-[#fdfbf7] p-10 flex flex-col justify-center relative">
                            {/* Old Paper Texture Overlay */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }}></div>

                            <div className="relative z-10 text-center md:text-left space-y-4">
                                <div className="inline-block p-3 rounded-lg bg-amber-100/50 mb-2">
                                    <svg className="w-8 h-8 text-amber-800/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-amber-900/80">Beyond the Folder</h3>
                                <p className="text-amber-900/70 italic">
                                    "For too long, the history of our brothers and sisters was vulnerable to the wear and tear of physical folders."
                                </p>
                            </div>
                        </div>

                        {/* Modern Lantern Side */}
                        <div className="bg-forest-900 p-10 flex flex-col justify-center relative overflow-hidden text-cream-100">
                            {/* Glow effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-forest-500/20 blur-3xl rounded-full"></div>

                            <div className="relative z-10 text-center md:text-left space-y-4">
                                <div className="inline-block p-3 rounded-lg bg-forest-800 mb-2 shadow-lg shadow-forest-950/20">
                                    <svg className="w-8 h-8 text-cream-100 drop-shadow-[0_0_8px_rgba(255,255,230,0.6)]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-white">Preserving Our History</h3>
                                <p className="text-cream-200/80">
                                    "This application serves as a digital vault, ensuring that no name is forgotten and no legacy is lost."
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Meet the Founder */}
                <section className="bg-forest-900 rounded-3xl overflow-hidden relative text-cream-100">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]">
                        <svg width="100%" height="100%">
                            <pattern id="founder-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M30 0L60 30L30 60L0 30L30 0Z" fill="white" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#founder-pattern)" />
                        </svg>
                    </div>

                    <div className="relative p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-12">
                        {/* Profile Photo */}
                        <div className="flex-shrink-0">
                            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-cream-200 border-4 border-cream-100/20 shadow-2xl overflow-hidden relative group">
                                <img
                                    src={founderImage}
                                    alt="Sulleyman Zulkanain (Abowolo)"
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center md:text-left space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-forest-400 font-bold tracking-wider text-sm uppercase mb-2">Meet the Founder</h2>
                                <h3 className="font-heading text-3xl sm:text-4xl font-bold text-cream-100">
                                    Sulleyman Zulkanain (Abowolo)
                                </h3>
                                <p className="text-cream-300/80 text-lg">Son of Alhaji Sulleymana</p>
                            </div>

                            {/* Mission Statement */}
                            <blockquote className="text-xl font-light italic text-cream-200 leading-relaxed font-heading border-l-4 border-forest-500 pl-6 md:pl-0 md:border-l-0">
                                "Driven by the need to preserve the legacy of our loved ones, I am leading the transition from traditional folder-based documentation to a modern, secure, and accessible digital archive for the Kamgbunli Muslim Community."
                            </blockquote>

                            {/* Bio */}
                            <p className="text-cream-300/80 leading-relaxed">
                                A graduate of Computer Science from the University of Cape Coast (UCC) and a former Science student at Uthman Bin Affan Islamic Senior High School, Sulleyman combines technical expertise with a deep commitment to his community. By utilizing his background, he is building this platform as a <strong>Sadaqah Jariyah</strong> to benefit the Kamgbunli community for generations to come.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-8 pb-4">
                    <p className="text-forest-700/60 italic font-serif text-sm">
                        Dedicated to the elders and families of Kamgbunli, who taught us the value of memory and faith.
                    </p>
                </div>

            </div>
        </div>
    );
}
