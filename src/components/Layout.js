import React from 'react';
import { Outlet, Link } from 'react-router-dom';
// 1. Import the Settings and UserPlus icons
import { Home, BarChart2, LogOut, UserPlus, Settings } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';

const Layout = () => {
    const { signOut } = useAuthenticator((context) => [context.signOut]);

    return (
        <div className="min-h-screen font-sans flex flex-col sm:flex-row bg-gray-100">
            {/* --- Side Navigation Bar --- */}
            <nav className="w-full sm:w-20 bg-[#0A2B4E] text-white flex sm:flex-col items-center justify-around sm:justify-start sm:py-8 shadow-lg z-10">
                <div className="text-center mb-0 sm:mb-12">
                    <img src="https://placehold.co/40x40/FFFFFF/0A2B4E?text=B" alt="Bountifuel Logo" className="w-10 h-10 rounded-full mx-auto" />
                </div>
                <Link to="/" className="p-3 rounded-lg hover:bg-cyan-700 transition-colors" title="Dashboard">
                    <Home className="w-6 h-6" />
                </Link>
                <Link to="/profiles" className="p-3 mt-0 sm:mt-4 rounded-lg hover:bg-cyan-700 transition-colors" title="Profiles">
                    <BarChart2 className="w-6 h-6" />
                </Link>
                {/* This link is for the full sign-up flow, useful for development */}
                <Link to="/signup" className="p-3 mt-0 sm:mt-4 rounded-lg hover:bg-cyan-700 transition-colors" title="Full Sign Up">
                    <UserPlus className="w-6 h-6" />
                </Link>
                 {/* 2. Add the new link to the Settings page */}
                <Link to="/settings" className="p-3 mt-0 sm:mt-4 rounded-lg hover:bg-cyan-700 transition-colors" title="Settings">
                    <Settings className="w-6 h-6" />
                </Link>
                <div className="mt-0 sm:mt-auto">
                    <button onClick={signOut} className="p-3 rounded-lg hover:bg-red-500 transition-colors" title="Sign Out">
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            <main className="flex-grow flex justify-center items-center p-0 sm:p-4 bg-gray-200">
                <Outlet /> {/* This is where the routed pages will be rendered */}
            </main>
        </div>
    );
};

export default Layout;