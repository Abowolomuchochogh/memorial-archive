import { Link } from 'react-router-dom';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-forest-900 text-cream-200 border-t border-forest-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main footer */}
                <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cream-400 flex items-center justify-center text-forest-900 font-heading font-bold text-sm">
                                K
                            </div>
                            <span className="font-heading text-lg font-semibold text-cream-100">
                                Kamgbunli Legacy
                            </span>
                        </div>
                        <p className="text-sm text-cream-300 leading-relaxed">
                            Honouring the lives and legacies of our beloved community members.
                            A sacred space of remembrance for the Kamgbunli Muslim Community.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="font-heading text-cream-100 font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-sm text-cream-300 hover:text-cream-400 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/archive" className="text-sm text-cream-300 hover:text-cream-400 transition-colors">
                                    Memorial Archive
                                </Link>
                            </li>
                            <li>
                                <Link to="/upload" className="text-sm text-cream-300 hover:text-cream-400 transition-colors">
                                    Submit a Memorial
                                </Link>
                            </li>
                            <li>
                                <Link to="/guidelines" className="text-sm text-cream-300 hover:text-cream-400 transition-colors">
                                    Community Guidelines
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-sm text-cream-300 hover:text-cream-400 transition-colors">
                                    Our Story
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Islamic reminder */}
                    <div>
                        <h3 className="font-heading text-cream-100 font-semibold mb-4">In Remembrance</h3>
                        <blockquote className="text-sm text-cream-300 italic leading-relaxed border-l-2 border-cream-400 pl-4">
                            "Every soul shall taste death. And only on the Day of Judgement shall you be paid your full recompense."
                            <span className="block mt-2 not-italic text-cream-400 font-medium">— Quran 3:185</span>
                        </blockquote>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-forest-800 py-6 text-center">
                    <p className="text-xs text-cream-300/70">
                        &copy; {year} Kamgbunli Legacy. Built with love for the Kamgbunli Muslim Community.
                    </p>
                </div>
            </div>
        </footer>
    );
}
