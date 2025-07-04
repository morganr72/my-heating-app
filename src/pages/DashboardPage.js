import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Droplet, LoaderCircle } from 'lucide-react';

// --- Helper Functions and Components ---

const fetchWithAuth = async (url, options = {}) => {
    // This function remains the same as before
    // It should be defined here or imported from a shared utils file
    const { fetchAuthSession } = await import('aws-amplify/auth');
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const headers = { ...options.headers, 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers, mode: 'cors', cache: 'no-cache' });
    } catch (error) {
        console.error("Amplify Auth Error:", error);
        return fetch(url, { ...options, headers: { 'Content-Type': 'application/json' }, mode: 'cors', cache: 'no-cache' });
    }
};

const FlameIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
  </svg>
);

const WaterDropletIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 007 7z"/>
    </svg>
);

const HeatingDashboard = ({ dashboardData, onBoostClick, isBoosting }) => {
    const minGaugeTemp = 16;
    const maxGaugeTemp = 25;

    const calculateNeedleRotation = (temp) => {
        const minAngle = -120;
        const maxAngle = 120;
        const tempPercentage = Math.max(0, Math.min(1, (temp - minGaugeTemp) / (maxGaugeTemp - minGaugeTemp)));
        return minAngle + tempPercentage * (maxAngle - minAngle);
    };

    const needleRotation = useMemo(() => calculateNeedleRotation(dashboardData.roomTemperature), [dashboardData.roomTemperature]);
    const gaugeGradient = useMemo(() => {
        const tempRange = maxGaugeTemp - minGaugeTemp;
        if (tempRange <= 0) return 'conic-gradient(from 240deg, #888 0deg, #888 240deg, transparent 240deg)';
        const lowTempPercent = ((dashboardData.destTempLow - minGaugeTemp) / tempRange) * 100;
        const highTempPercent = ((dashboardData.destTempHigh - minGaugeTemp) / tempRange) * 100;
        const lowTempDegree = (lowTempPercent / 100) * 240;
        const highTempDegree = (highTempPercent / 100) * 240;
        return `conic-gradient(from 240deg, #3498db 0deg, #3498db ${lowTempDegree}deg, #2ecc71 ${lowTempDegree}deg, #2ecc71 ${highTempDegree}deg, #e74c3c ${highTempDegree}deg, #e74c3c 240deg, transparent 240deg)`;
    }, [dashboardData.destTempLow, dashboardData.destTempHigh]);

    const isBoostActive = dashboardData.boostType === 'H';

    return (
        <div className="flex-grow flex flex-col items-center px-6 text-center z-10 overflow-y-auto w-full text-white">
            <div className="my-6 text-4xl font-bold flex items-center"><span className="text-2xl opacity-70 mr-2">+</span>£{dashboardData.weeklySavings.toFixed(2)}<span className="text-2xl opacity-70 ml-2">+</span></div>
            <div className="relative w-80 h-80 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0)] rounded-full"></div>
                <div className="absolute inset-[15px] rounded-full" style={{ background: gaugeGradient, mask: 'radial-gradient(transparent 100px, white 101px)', WebkitMask: 'radial-gradient(transparent 100px, white 101px)',}}></div>
                <div className="absolute inset-[40px] bg-gradient-to-b from-[#0A2B4E] to-[#1AC9E9] rounded-full flex flex-col items-center justify-center"><FlameIcon className="w-16 h-16 opacity-10"/></div>
                <div className="absolute inset-0 flex justify-center items-start pt-6 transition-transform duration-1000" style={{ transform: `rotate(${needleRotation}deg)` }}><div className="w-1.5 h-24 bg-white rounded-full shadow-lg"></div></div>
                <div className="absolute inset-0 flex justify-center items-center"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                <div className="absolute inset-0 flex flex-col justify-center items-center pt-20 pointer-events-none">
                    <div className="text-5xl font-bold">{dashboardData.roomTemperature.toFixed(1)}°C</div>
                    <div className="text-xs opacity-80 mt-1">ROOM TEMPERATURE</div>
                </div>
            </div>
            <p className="mt-6 text-sm">The Water Temperature is {dashboardData.waterTemperature}°C</p>
            <button onClick={onBoostClick} disabled={isBoosting} className="mt-4 flex flex-col items-center group">
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 ${isBoostActive ? 'bg-orange-500' : 'bg-white'}`}>
                    {isBoosting && dashboardData.boostType === 'H' ? <LoaderCircle className="w-10 h-10 text-white animate-spin" /> : <FlameIcon className={`w-10 h-10 ${isBoostActive ? 'text-white' : 'text-[#0A2B4E]'}`}/>}
                </div>
                <span className={`mt-2 font-semibold tracking-widest ${isBoostActive ? 'text-orange-400' : 'text-white'}`}>HEAT BOOST</span>
            </button>
        </div>
    );
};

const WaterStatusPage = ({ dashboardData, onWaterBoostClick, isBoosting }) => {
    const tankFullness = (dashboardData.tankCapacity > 0) ? (parseFloat(dashboardData.waterVol) / parseFloat(dashboardData.tankCapacity)) * 100 : 0;
    const calculateNeedleRotation = (percentage) => {
        const minAngle = -120; const maxAngle = 120;
        const needlePercentage = Math.max(0, Math.min(100, percentage)) / 100;
        return minAngle + needlePercentage * (maxAngle - minAngle);
    };
    const getTankStatusText = (percentage) => {
        if (percentage <= 30) return "You have an empty Tank of Hot Water";
        if (percentage <= 69) return "You have a half full Tank of Hot Water";
        return "You have a full Tank of Hot Water";
    };
    const needleRotation = calculateNeedleRotation(tankFullness);
    const isWaterBoostActive = dashboardData.boostType === 'W';
    return (
        <main className="flex-grow flex flex-col items-center px-6 text-center z-10 overflow-y-auto w-full text-white">
             <div className="my-6 text-4xl font-bold flex items-center"><span className="text-2xl opacity-70 mr-2">+</span>£5.25<span className="text-2xl opacity-70 ml-2">+</span></div>
            <div className="relative w-80 h-80 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0)] rounded-full"></div>
                <div className="absolute inset-[15px] rounded-full" style={{ background: 'conic-gradient(from 240deg, #8e44ad 0deg, #3498db 120deg, #e74c3c 240deg, transparent 240deg)', mask: 'radial-gradient(transparent 100px, white 101px)', WebkitMask: 'radial-gradient(transparent 100px, white 101px)',}}></div>
                <div className="absolute inset-[40px] bg-gradient-to-b from-[#0A2B4E] to-[#1AC9E9] rounded-full flex flex-col items-center justify-center"><WaterDropletIcon className="w-16 h-16 opacity-10"/></div>
                <div className="absolute inset-0 flex justify-center items-start pt-6 transition-transform duration-1000" style={{ transform: `rotate(${needleRotation}deg)` }}><div className="w-1.5 h-24 bg-white rounded-full shadow-lg"></div></div>
                <div className="absolute inset-0 flex justify-center items-center"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                <div className="absolute inset-0 flex flex-col justify-center items-center pt-20 pointer-events-none">
                    <div className="text-5xl font-bold">{dashboardData.waterTemperature.toFixed(1)}°C</div>
                    <div className="text-xs opacity-80 mt-1">WATER TEMPERATURE</div>
                </div>
                <div className="absolute bottom-[22%] left-0 right-0 flex justify-between px-10"><span className="text-xs opacity-80">EMPTY</span><span className="text-xs opacity-80">FULL</span></div>
            </div>
            <p className="mt-6 text-sm">{getTankStatusText(tankFullness)}</p>
            <button onClick={onWaterBoostClick} disabled={isBoosting} className="mt-4 flex flex-col items-center group">
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 ${isWaterBoostActive ? 'bg-blue-500' : 'bg-white'}`}>
                    {isBoosting && dashboardData.boostType === 'W' ? <LoaderCircle className="w-10 h-10 text-white animate-spin" /> : <WaterDropletIcon className={`w-10 h-10 ${isWaterBoostActive ? 'text-white' : 'text-[#0A2B4E]'}`}/>}
                </div>
                <span className={`mt-2 font-semibold tracking-widest ${isWaterBoostActive ? 'text-cyan-300' : 'text-white'}`}>WATER BOOST</span>
            </button>
        </main>
    );
};

// --- Main Dashboard Page Component ---
const DashboardPage = () => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [activePage, setActivePage] = useState('heating');
    const [dashboardData, setDashboardData] = useState({
        userName: "User", weeklySavings: 0, roomTemperature: 20.2, waterTemperature: 0,
        status: "...", destTempLow: 18, destTempHigh: 22, boostType: 'N',
        waterVol: 50, tankCapacity: 100,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isBoosting, setIsBoosting] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const response = await fetchWithAuth('https://kbrcagx0xi.execute-api.eu-west-2.amazonaws.com/default/FrontPageAPIv2', { method: 'GET' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}.`);
            const data = await response.json();
            const apiContent = data.content[0];
            if (apiContent) {
                 setDashboardData({
                    userName: apiContent.name || "User",
                    weeklySavings: parseFloat(apiContent.gascost) - parseFloat(apiContent.actcost),
                    roomTemperature: parseFloat(apiContent.roomtemp),
                    waterTemperature: parseFloat(apiContent.watertemp),
                    status: apiContent.currrunning, 
                    destTempLow: parseFloat(apiContent.destemplow),
                    destTempHigh: parseFloat(apiContent.destemphigh),
                    boostType: apiContent.boosttype,
                    waterVol: parseFloat(apiContent.watervol),
                    tankCapacity: parseFloat(apiContent.tankcapacity),
                });
            } else { throw new Error("API returned no content."); }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBoost = async (boostTypeToSet) => {
        if (isBoosting) return;
        setIsBoosting(true);
        const heatWaterValue = dashboardData.boostType === boostTypeToSet ? 'C' : boostTypeToSet;
        try {
            // ** FIX IS HERE: The request body now only sends the essential data. **
            // The backend should determine the user and premise from the auth token.
            await fetchWithAuth('https://3gtpvcw888.execute-api.eu-west-2.amazonaws.com/default/BoostAppAPIv2', {
                method: 'POST',
                body: JSON.stringify({ heatwater: heatWaterValue })
            });
            setDashboardData(prev => ({...prev, boostType: heatWaterValue === 'C' ? 'N' : heatWaterValue }));
            setTimeout(() => { fetchData().finally(() => setIsBoosting(false)); }, 1000); 
        } catch (err) {
            console.error("Failed to update boost status:", err);
            setError(err.message);
            setIsBoosting(false);
        }
    };

    const getGreeting = () => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) return "Good Morning!";
        if (currentHour < 18) return "Good Afternoon!";
        return "Good Evening!";
    };

    if (isLoading) return <div className="flex items-center justify-center h-full text-gray-500"><LoaderCircle className="w-16 h-16 animate-spin"/></div>;
    if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

    const formatButtonText = (status) => {
        if (!status || status === "...") return { line1: '...', line2: '' };
        const words = status.split(' ');
        return { line1: words[0].toUpperCase(), line2: words.slice(1).join(' ').toUpperCase() };
    };
    const { line1, line2 } = formatButtonText(dashboardData.status);

    return (
        <div className="w-full max-w-sm h-[812px] bg-gradient-to-b from-[#0A2B4E] to-[#1AC9E9] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
            <header className="flex justify-between items-center p-5 z-20 flex-shrink-0 text-white">
                <div className="text-left">
                    <h1 className="text-2xl">{getGreeting()}</h1>
                    <p className="text-sm opacity-80">{user?.attributes?.email}</p>
                </div>
            </header>
            <div className="flex-grow overflow-hidden relative">
                <div className="flex w-[200%] h-full transition-transform duration-500" style={{ transform: `translateX(${activePage === 'heating' ? '0%' : '-50%'})` }}>
                    <HeatingDashboard dashboardData={dashboardData} onBoostClick={() => handleBoost('H')} isBoosting={isBoosting} />
                    <WaterStatusPage dashboardData={dashboardData} onWaterBoostClick={() => handleBoost('W')} isBoosting={isBoosting} />
                </div>
            </div>
            <div className="absolute bottom-16 right-6 z-20">
                <button className="w-20 h-20 bg-white rounded-full border-4 border-green-400 flex flex-col items-center justify-center text-green-400 font-bold shadow-xl text-sm leading-tight">
                    <span>{line1}</span>
                    {line2 && <span>{line2}</span>}
                </button>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                <button onClick={() => setActivePage('heating')} className={`w-2 h-2 rounded-full transition-colors ${activePage === 'heating' ? 'bg-white' : 'bg-white/50'}`}></button>
                <button onClick={() => setActivePage('water')} className={`w-2 h-2 rounded-full transition-colors ${activePage === 'water' ? 'bg-white' : 'bg-white/50'}`}></button>
            </div>
        </div>
    );
};

export default DashboardPage;
