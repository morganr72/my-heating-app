import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Wifi, ChevronRight, CreditCard } from 'lucide-react';

const SettingsPage = () => {
    const navigate = useNavigate();

    const handleRunFullSetup = () => {
        // Navigate to the signup route and tell it to start at step 1
        navigate('/signup', { state: { startStep: 1 } });
    };

    const handleReconfigureWifi = () => {
        // Navigate to the signup route and tell it to start at step 3 (Hardware Setup)
        navigate('/signup', { state: { startStep: 3 } });
    };

    const handleSecondaryWifiSetup = () => {
        // This will also navigate to the hardware setup step.
        // The UserSignUp component is designed to handle both primary and secondary setup.
        navigate('/signup', { state: { startStep: 3 } });
    };

    const handlePaymentSetup = () => {
        navigate('/payment-setup');
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-[#0A2B4E]/50 p-8 rounded-2xl shadow-2xl text-white">
            <h1 className="text-3xl font-bold text-center mb-8">Settings</h1>
            <div className="space-y-4">
                <button
                    onClick={handleRunFullSetup}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <User className="w-6 h-6 mr-4 text-cyan-300" />
                        <div>
                            <p className="font-semibold text-left">Run Full User Setup</p>
                            <p className="text-xs text-white/70 text-left">Set up user, property, and hardware details from the beginning.</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    onClick={handleReconfigureWifi}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <Wifi className="w-6 h-6 mr-4 text-cyan-300" />
                        <div>
                            <p className="font-semibold text-left">Re-configure Primary WiFi</p>
                            <p className="text-xs text-white/70 text-left">Update the main WiFi network for your controller.</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    onClick={handleSecondaryWifiSetup}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <Wifi className="w-6 h-6 mr-4 text-cyan-300" />
                        <div>
                            <p className="font-semibold text-left">Add/Edit Secondary WiFi</p>
                            <p className="text-xs text-white/70 text-left">Set up a backup WiFi network for improved reliability.</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    onClick={handlePaymentSetup}
                    className="w-full flex items-center justify-between p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <CreditCard className="w-6 h-6 mr-4 text-cyan-300" />
                        <div>
                            <p className="font-semibold text-left">Manage Payment Method</p>
                            <p className="text-xs text-white/70 text-left">Update your recurring subscription payment details.</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
