import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, MapPin, Home, Building, BedDouble, Users, ArrowRight, ArrowLeft, Check, Search, LoaderCircle, Bluetooth, Wifi, XCircle, CheckCircle, Settings, X, Signal, PlusCircle } from 'lucide-react';

// --- Custom House Type Icons ---

const DetachedIcon = (props) => (
    <svg {...props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 44V22L24 6L40 22V44H28V28H20V44H8Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SemiDetachedIcon = (props) => (
    <svg {...props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 44V24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 44V24L14 14L24 24V44H4Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M44 44V24L34 14L24 24V44H44Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
    </svg>
);

const TerracedIcon = (props) => (
    <svg {...props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 44V22L13 12L23 22V44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 44V22L33 12L43 22V44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 44V30H30V44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


// --- Reusable UI Components ---

const InputField = ({ icon, placeholder, value, onChange, error, name, type = 'text', disabled = false }) => (
    <div className="w-full">
        <div className={`flex items-center bg-white/10 border ${error ? 'border-red-400' : 'border-white/20'} rounded-lg p-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-400 ${disabled ? 'opacity-50' : ''}`}>
            {icon}
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                autoComplete="off"
                disabled={disabled}
                className="bg-transparent text-white placeholder-white/50 w-full ml-3 focus:outline-none disabled:cursor-not-allowed"
            />
        </div>
        {error && <p className="text-red-400 text-xs mt-1 ml-2">{error}</p>}
    </div>
);

const IconSelect = ({ options, selected, onSelect, error }) => (
    <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map(option => {
                const isSelected = selected === option.value;
                return (
                    <div
                        key={option.value}
                        onClick={() => onSelect(option.value)}
                        className={`flex flex-col items-center justify-start text-center p-3 rounded-lg cursor-pointer border-2 transition-all duration-300 min-h-[120px] ${isSelected ? 'bg-cyan-500/80 border-cyan-300' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                    >
                        <div className="h-10 w-10 mb-2 flex items-center justify-center">
                            {option.icon}
                        </div>
                        <span className="text-sm font-semibold text-white leading-tight">{option.label}</span>
                    </div>
                );
            })}
        </div>
         {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
    </div>
);

const NumberStepper = ({ icon, label, value, onIncrement, onDecrement, error }) => (
    <div className="w-full">
        <div className="bg-white/10 border border-white/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
                {icon}
                <span className="text-white ml-3">{label}</span>
            </div>
            <div className="flex items-center">
                <button onClick={onDecrement} className="w-8 h-8 rounded-full bg-white/20 text-white text-lg font-bold flex items-center justify-center hover:bg-white/30 transition-colors">-</button>
                <span className="text-white text-xl font-bold mx-4 w-8 text-center">{value}</span>
                <button onClick={onIncrement} className="w-8 h-8 rounded-full bg-white/20 text-white text-lg font-bold flex items-center justify-center hover:bg-white/30 transition-colors">+</button>
            </div>
        </div>
        {error && <p className="text-red-400 text-xs mt-1 ml-2">{error}</p>}
    </div>
);

const ProgressIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= 1 ? 'bg-cyan-500' : 'bg-white/20'}`}>{currentStep > 1 ? <Check className="text-white" /> : <User className="text-white" />}</div>
        <div className={`h-1 w-8 transition-all duration-300 ${currentStep > 1 ? 'bg-cyan-500' : 'bg-white/20'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= 2 ? 'bg-cyan-500' : 'bg-white/20'}`}>{currentStep > 2 ? <Check className="text-white" /> : <Home className="text-white" />}</div>
        <div className={`h-1 w-8 transition-all duration-300 ${currentStep > 2 ? 'bg-cyan-500' : 'bg-white/20'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep >= 3 ? 'bg-cyan-500' : 'bg-white/20'}`}>{currentStep > 3 ? <Check className="text-white" /> : <Bluetooth className="text-white" />}</div>
    </div>
);

const WifiScanModal = ({ isOpen, onClose, networks, onSelect, isLoading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-sm bg-[#0A2B4E] border border-cyan-500 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Available Networks</h3><button onClick={onClose} className="text-white/70 hover:text-white"><X size={24} /></button></div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40"><LoaderCircle className="w-10 h-10 animate-spin text-cyan-400" /><p className="mt-4 text-white/80">Scanning...</p></div>
                ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {networks.length > 0 ? networks.map((net, index) => (
                            <div key={index} onClick={() => onSelect(net.ssid)} className="flex items-center justify-between p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20">
                                <span className="font-semibold">{net.ssid}</span>
                                <div className="flex items-center text-xs text-white/70"><Signal size={16} className="mr-1" />{net.rssi} dBm</div>
                            </div>
                        )) : (<p className="text-center text-white/70 py-8">No networks found.</p>)}
                    </div>
                )}
            </div>
        </div>
    );
};

const SecondaryWifiModal = ({ isOpen, onClose, onSave, initialSsid, initialPassword }) => {
    const [ssid, setSsid] = useState(initialSsid || '');
    const [password, setPassword] = useState(initialPassword || '');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(ssid, password);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-sm bg-[#0A2B4E] border border-cyan-500 rounded-2xl shadow-lg p-6 text-white space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Secondary WiFi</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white"><X size={24} /></button>
                </div>
                <p className="text-sm text-white/70">Enter the details for your backup network.</p>
                <InputField icon={<Wifi className="text-white/50"/>} placeholder="Secondary WiFi SSID" name="wifiSSIDSecondary" value={ssid} onChange={(e) => setSsid(e.target.value)} />
                <InputField icon={<Wifi className="text-white/50"/>} placeholder="Secondary WiFi Password" name="wifiPasswordSecondary" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex gap-4 pt-4">
                    <button onClick={onClose} className="w-full flex items-center justify-center bg-white/20 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/30">Cancel</button>
                    <button onClick={handleSave} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600">Save</button>
                </div>
            </div>
        </div>
    );
};


// --- Main Sign Up Flow Component ---

const UserSignUp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const startStep = location.state?.startStep || 1;

    const [step, setStep] = useState(startStep);
    const [formData, setFormData] = useState({ fullName: '', address: '', houseType: '', bedrooms: 1, occupants: 1, wifiSSID: '', wifiPassword: '', wifiSSIDSecondary: '', wifiPasswordSecondary: '' });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const [btDevice, setBtDevice] = useState(null);
    const [btStatus, setBtStatus] = useState('disconnected');
    const [btError, setBtError] = useState('');
    const [isScanningWifi, setIsScanningWifi] = useState(false);
    const [scannedNetworks, setScannedNetworks] = useState([]);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isSecondaryModalOpen, setIsSecondaryModalOpen] = useState(false);

    const GETADDRESS_API_KEY = 'gPA9eeZLQEaItZUsbdgozQ46882';

    // --- Bluetooth Configuration ---
    const WIFI_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
    const WIFI_SSID_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
    const WIFI_PASS_CHAR_UUID = 'c842332e-36e2-4688-b7f5-ea07361b26a8';
    const WIFI_SSID_SEC_CHAR_UUID = '156e829a-5634-4a2b-8a8b-e4e4a023588b';
    const WIFI_PASS_SEC_CHAR_UUID = '29a8a6e8-e50f-48e0-9b37-531e5828e8c6';
    const WIFI_SCAN_TRIGGER_UUID = 'a7b2488f-5133-45b7-b359-5a21e655a224';
    const WIFI_SCAN_RESULT_UUID = 'd5e5c26b-0552-475a-a5ab-d735f50d5c43';
    const WIFI_STATUS_CHAR_UUID = '32b7a5a8-447c-445b-b892-3593e7f29599';

    useEffect(() => {
        if (searchTerm.length < 3) { setSuggestions([]); return; }
        setIsFetchingAddress(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`https://api.getAddress.io/autocomplete/${searchTerm}?api-key=${GETADDRESS_API_KEY}`);
                const data = await response.json();
                setSuggestions(data.suggestions || []);
            } catch (error) { console.error("Address fetch error:", error); setSuggestions([]); } finally { setIsFetchingAddress(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, GETADDRESS_API_KEY]);

    const handleSuggestionClick = (suggestion) => {
        setFormData(prev => ({ ...prev, address: suggestion.address }));
        setSearchTerm(suggestion.address);
        setSuggestions([]);
    };

    const handleScanAndConnect = async () => {
        if (!navigator.bluetooth) { setBtError("Web Bluetooth is not available on this browser."); setBtStatus('error'); return; }
        try {
            setBtStatus('connecting'); setBtError('');
            const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [WIFI_SERVICE_UUID] }], optionalServices: [WIFI_SERVICE_UUID] });
            setBtDevice(device);
            await device.gatt.connect();
            setBtStatus('connected');
        } catch (error) { console.error("BT connection failed:", error); setBtError(error.message); setBtStatus('error'); }
    };

    const handleWifiScan = async () => {
        if (!btDevice?.gatt.connected) { setBtError("Device not connected."); setBtStatus('error'); return; }
        setIsScanningWifi(true); setIsScanModalOpen(true);
        try {
            const server = await btDevice.gatt.connect();
            const service = await server.getPrimaryService(WIFI_SERVICE_UUID);
            const scanTriggerChar = await service.getCharacteristic(WIFI_SCAN_TRIGGER_UUID);
            const scanResultChar = await service.getCharacteristic(WIFI_SCAN_RESULT_UUID);

            const handleScanNotification = (event) => {
                const value = event.target.value;
                const jsonString = new TextDecoder().decode(value);
                scanResultChar.removeEventListener('characteristicvaluechanged', handleScanNotification);
                
                try {
                    if (!jsonString) { throw new Error("Empty scan result"); }
                    const rawNetworks = JSON.parse(jsonString);
                    const networkMap = new Map();
                    rawNetworks.forEach(net => { if (net.ssid && (!networkMap.has(net.ssid) || net.rssi > networkMap.get(net.ssid).rssi)) { networkMap.set(net.ssid, net); } });
                    setScannedNetworks(Array.from(networkMap.values()).sort((a, b) => b.rssi - a.rssi));
                } catch (e) {
                    console.error("Error processing scan results:", e);
                    setBtError("Failed to parse scan results.");
                    setScannedNetworks([]);
                } finally {
                    setIsScanningWifi(false);
                }
            };

            await scanResultChar.startNotifications();
            scanResultChar.addEventListener('characteristicvaluechanged', handleScanNotification);
            
            await scanTriggerChar.writeValue(new Uint8Array([1]));

        } catch (error) { console.error("WiFi scan failed:", error); setBtError(error.message); setIsScanningWifi(false); setIsScanModalOpen(false); }
    };
    
    const handleSelectNetwork = (ssid) => { setFormData(prev => ({ ...prev, wifiSSID: ssid })); setIsScanModalOpen(false); };

    const handleSaveSecondary = (ssid, password) => {
        setFormData(prev => ({ ...prev, wifiSSIDSecondary: ssid, wifiPasswordSecondary: password }));
    };

    const handleSendWifiCredentials = async () => {
        if (!btDevice?.gatt.connected || !formData.wifiSSID) { setBtError("Device not connected or Primary SSID is empty."); setBtStatus('error'); return; }
        setBtStatus('testing'); setBtError('');
        try {
            const server = await btDevice.gatt.connect();
            const service = await server.getPrimaryService(WIFI_SERVICE_UUID);
            const encoder = new TextEncoder();
            const ssidChar = await service.getCharacteristic(WIFI_SSID_CHAR_UUID);
            const passChar = await service.getCharacteristic(WIFI_PASS_CHAR_UUID);
            const ssidSecChar = await service.getCharacteristic(WIFI_SSID_SEC_CHAR_UUID);
            const passSecChar = await service.getCharacteristic(WIFI_PASS_SEC_CHAR_UUID);
            const statusChar = await service.getCharacteristic(WIFI_STATUS_CHAR_UUID);

            await statusChar.startNotifications();
            const statusListener = (event) => {
                const status = new TextDecoder().decode(event.target.value);
                statusChar.removeEventListener('characteristicvaluechanged', statusListener);
                if (status === '1') { setStep(4); } else { setBtError("WiFi connection failed. Check credentials."); setBtStatus('connected'); }
            };
            statusChar.addEventListener('characteristicvaluechanged', statusListener);

            await ssidChar.writeValue(encoder.encode(formData.wifiSSID));
            await passChar.writeValue(encoder.encode(formData.wifiPassword));
            await ssidSecChar.writeValue(encoder.encode(formData.wifiSSIDSecondary));
            await passSecChar.writeValue(encoder.encode(formData.wifiPasswordSecondary));
        } catch (error) { console.error("Send credentials failed:", error); setBtError(error.message); setBtStatus('error'); }
    };

    const houseTypeOptions = [{ value: 'detached', label: 'Detached', icon: <DetachedIcon className="w-8 h-8 text-white" /> }, { value: 'semi-detached', label: 'Semi-Detached', icon: <SemiDetachedIcon className="w-10 h-10 text-white" /> }, { value: 'terraced', label: 'Terraced', icon: <TerracedIcon className="w-10 h-10 text-white" /> }, { value: 'flat', label: <>Flat /<br/>Apartment</>, icon: <Building className="w-8 h-8 text-white" /> }];
    const handleInputChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => { if (step === 3 && startStep === 3) { navigate('/settings'); } else { setStep(s => s - 1); } };
    const handleExit = () => { if (startStep === 3) { navigate('/settings'); } else { navigate('/'); } };

    const renderStep = () => {
        switch (step) {
            case 1: return (<div className="w-full flex flex-col items-center space-y-6 animate-fade-in"><h2 className="text-2xl font-bold text-white">Tell Us About Yourself</h2><InputField icon={<User className="text-white/50" />} placeholder="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} error={errors.fullName} /><div className="w-full relative"><InputField icon={isFetchingAddress ? <LoaderCircle className="animate-spin" /> : <MapPin className="text-white/50" />} placeholder="Start typing your address..." name="addressSearch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} error={errors.address} />{suggestions.length > 0 && (<ul className="absolute z-10 w-full bg-[#0A2B4E] border border-cyan-500 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">{suggestions.map((s) => (<li key={s.id} onClick={() => handleSuggestionClick(s)} className="px-4 py-3 text-white/90 cursor-pointer hover:bg-cyan-500/20">{s.address}</li>))}</ul>)}</div><button onClick={handleNext} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600">Next <ArrowRight className="ml-2" /></button></div>);
            case 2: return (<div className="w-full flex flex-col items-center space-y-6 animate-fade-in"><h2 className="text-2xl font-bold text-white">Property Details</h2><IconSelect options={houseTypeOptions} selected={formData.houseType} onSelect={(v) => setFormData(p => ({ ...p, houseType: v }))} error={errors.houseType} /><NumberStepper icon={<BedDouble className="text-white/50" />} label="Bedrooms" value={formData.bedrooms} onIncrement={() => setFormData(p => ({ ...p, bedrooms: p.bedrooms + 1 }))} onDecrement={() => setFormData(p => ({ ...p, bedrooms: Math.max(1, p.bedrooms - 1) }))} /><NumberStepper icon={<Users className="text-white/50" />} label="Occupants" value={formData.occupants} onIncrement={() => setFormData(p => ({ ...p, occupants: p.occupants + 1 }))} onDecrement={() => setFormData(p => ({ ...p, occupants: Math.max(1, p.occupants - 1) }))} /><div className="w-full flex flex-col sm:flex-row-reverse items-center gap-4"><button onClick={handleNext} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600">Next <ArrowRight className="ml-2" /></button><button onClick={handleBack} className="w-full sm:w-auto flex items-center justify-center bg-white/20 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/30"><ArrowLeft className="mr-2" /> Back</button></div></div>);
            case 3: const isSending = btStatus === 'testing'; return (<div className="w-full flex flex-col items-center space-y-6 animate-fade-in text-center"><h2 className="text-2xl font-bold text-white">Hardware Setup</h2><p className="text-white/80">Connect your controller to WiFi.</p>{btStatus === 'disconnected' && (<button onClick={handleScanAndConnect} className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105"><Bluetooth className="mr-2" /> Scan for Controller</button>)} {(btStatus === 'connecting' || btStatus === 'testing') && (<div className="flex flex-col items-center justify-center h-40 text-white"><LoaderCircle className="w-16 h-16 animate-spin" /><p className="mt-4 text-lg">{btStatus === 'testing' ? 'Testing Connection...' : 'Connecting...'}</p></div>)} {btStatus === 'error' && (<div className="w-full bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg flex flex-col items-center gap-3"><XCircle className="w-8 h-8" /><p className="text-sm font-semibold">An Error Occurred</p><p className="text-xs">{btError}</p><button onClick={() => setBtStatus('connected')} className="mt-2 text-xs underline">Try Again</button></div>)} {btStatus === 'connected' && (<div className="w-full space-y-4 text-left"><div className="w-full bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg flex items-center gap-3"><CheckCircle className="w-8 h-8 flex-shrink-0" /><div><p className="font-bold">Controller Connected!</p><p className="text-xs">{btDevice.name}</p></div></div><button onClick={handleWifiScan} disabled={isScanningWifi} className="w-full flex items-center justify-center text-sm bg-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/30">{isScanningWifi ? <LoaderCircle className="animate-spin mr-2" /> : <Search className="mr-2" />}Scan for WiFi Networks</button><InputField icon={<Wifi className="text-white/50"/>} placeholder="Primary WiFi SSID" name="wifiSSID" value={formData.wifiSSID} onChange={handleInputChange} disabled={isSending} /><InputField icon={<Wifi className="text-white/50"/>} placeholder="Primary WiFi Password" name="wifiPassword" type="password" value={formData.wifiPassword} onChange={handleInputChange} disabled={isSending} /><hr className="border-white/20 my-2" /><button onClick={() => setIsSecondaryModalOpen(true)} disabled={isSending} className="w-full flex items-center justify-center text-sm bg-transparent text-cyan-300 font-bold py-2 px-4 rounded-lg hover:bg-white/10"><PlusCircle className="mr-2" size={16}/>Add/Edit Secondary WiFi</button><button onClick={handleSendWifiCredentials} disabled={isSending} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600 mt-4 disabled:bg-gray-500">{isSending ? 'Testing...' : 'Send Credentials & Connect'}</button>{btError && <p className="text-red-400 text-sm text-center pt-2">{btError}</p>}</div>)}<div className="w-full flex justify-center pt-4"><button onClick={handleBack} className="w-full sm:w-auto flex items-center justify-center bg-white/20 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/30"><ArrowLeft className="mr-2" /> Back</button></div></div>);
            case 4: return (<div className="w-full flex flex-col items-center text-center space-y-6 animate-fade-in"><div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce"><Check size={64} className="text-white" /></div><h2 className="text-3xl font-bold text-white">Setup Complete!</h2><p className="text-white/80">Your hardware is connected and you're all set.</p>{startStep === 3 ? (<button onClick={() => navigate('/settings')} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600"><Settings className="mr-2" /> Back to Settings</button>) : (<button onClick={() => navigate('/')} className="w-full flex items-center justify-center bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-600">Go to Dashboard <ArrowRight className="ml-2" /></button>)}</div>);
            default: return null;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-[#0A2B4E] to-[#1AC9E9] flex items-center justify-center p-4 font-sans">
            <WifiScanModal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} networks={scannedNetworks} onSelect={handleSelectNetwork} isLoading={isScanningWifi} />
            <SecondaryWifiModal 
                isOpen={isSecondaryModalOpen}
                onClose={() => setIsSecondaryModalOpen(false)}
                onSave={handleSaveSecondary}
                initialSsid={formData.wifiSSIDSecondary}
                initialPassword={formData.wifiPasswordSecondary}
            />
            <div className="relative w-full max-w-md bg-black/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 space-y-8">
                <button onClick={handleExit} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20" aria-label="Close setup"><X size={24} /></button>
                <ProgressIndicator currentStep={step} />
                {renderStep()}
            </div>
            <style jsx global>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
                @keyframes bounce { 0%, 100% { transform: translateY(-15%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
                .animate-bounce { animation: bounce 1s infinite; }
            `}</style>
        </div>
    );
};

export default UserSignUp;
