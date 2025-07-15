import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Helper: API Fetching ---
const fetchWithAuth = async (url, options = {}) => {
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

// --- Styling and Constants ---
const PROFILE_COLORS = {
    background: '#13a1a1', card: 'rgba(255, 255, 255, 0.1)', text: '#ffffff',
    activeButton: '#2a2f4c', inactiveButtonBorder: '#ffffff', saveButton: '#ffffff',
    saveButtonText: '#2a2f4c', deleteButton: '#ef4444', deleteButtonText: '#ffffff',
    redShades: ['#f06e6e', '#e15d5d', '#d24c4c', '#c33b3b', '#b42a2a'], barColor: '#f06e6e',
};
const DAY_ABBREVIATIONS = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' };
const ALL_DAYS_OF_WEEK = Object.keys(DAY_ABBREVIATIONS);

// --- Reusable UI Components ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="w-full max-w-lg rounded-2xl p-8 bg-white/20 backdrop-blur-md text-white">
                <h2 className="text-2xl font-bold text-center mb-4">{title}</h2>
                <p className="text-center mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                     <button onClick={onConfirm} className="font-bold py-2 px-8 rounded-full transition-transform hover:scale-105" style={{ backgroundColor: PROFILE_COLORS.deleteButton, color: PROFILE_COLORS.deleteButtonText }}>{confirmText}</button>
                     <button onClick={onClose} className="font-bold py-2 px-8 rounded-full transition-transform hover:scale-105" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>{cancelText}</button>
                </div>
            </div>
        </div>
    );
};

const NumberCircleInput = ({ label, value, onIncrement, onDecrement, disabled }) => (
    <div className="flex flex-col items-center">
        <button onClick={onIncrement} disabled={disabled} className="text-white text-3xl opacity-80 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed mb-1">▲</button>
        <div className={`w-24 h-24 border-4 border-white rounded-full flex justify-center items-center ${disabled ? 'opacity-50' : ''}`}>
             <span className="text-white text-4xl font-bold text-center">{String(value).padStart(2, '0')}</span>
        </div>
        <button onClick={onDecrement} disabled={disabled} className="text-white text-3xl opacity-80 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed mt-1">▼</button>
        <label className="text-white opacity-80 mt-2">{label}</label>
    </div>
);

const EditChunkModal = ({ chunk, isOpen, onClose, onSubmit, onDelete, isNew, isFirstChunk, isLastChunk }) => {
    const [startHour, setStartHour] = useState(0);
    const [startMinute, setStartMinute] = useState(0);
    const [endHour, setEndHour] = useState(0);
    const [endMinute, setEndMinute] = useState(0);
    const [lowTemp, setLowTemp] = useState(18);
    const [highTemp, setHighTemp] = useState(21);

    useEffect(() => {
        if (isOpen) {
            if (isNew) {
                setStartHour(8); setStartMinute(0); setEndHour(17); setEndMinute(0); setLowTemp(18); setHighTemp(21);
            } else if (chunk) {
                const [sH, sM] = chunk.x1.split(':').map(Number);
                const [eH, eM] = chunk.x2.split(':').map(Number);
                let displayEndHour = eH, displayEndMinute = eM + 30;
                if (displayEndMinute >= 60) { displayEndHour = (displayEndHour + 1) % 24; displayEndMinute = 0; }
                setStartHour(sH); setStartMinute(sM); setEndHour(displayEndHour); setEndMinute(displayEndMinute);
                setLowTemp(Number(chunk.lowTemp)); setHighTemp(Number(chunk.highTemp));
            }
        }
    }, [chunk, isNew, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => onSubmit({ ...chunk, startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`, endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`, lowTemp: String(lowTemp), highTemp: String(highTemp) });
    
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"><div className="w-full max-w-4xl rounded-2xl p-8" style={{backgroundColor: PROFILE_COLORS.background}}><header className="flex justify-between items-center text-white mb-8"><div className="flex-1"></div><div className="flex-1 text-center"><h2 className="text-3xl font-bold">Heating Profile Entry</h2><p className="text-lg opacity-80">TIME RANGE</p></div><div className="flex-1 flex justify-end"><button onClick={onClose} className="text-4xl hover:opacity-80 transition-opacity">&times;</button></div></header><div className="flex justify-center items-center gap-4 mb-8"><NumberCircleInput label="Hour" value={startHour} onIncrement={() => setStartHour(p => (p + 1) % 24)} onDecrement={() => setStartHour(p => (p - 1 + 24) % 24)} /><span className="text-white text-4xl">:</span><NumberCircleInput label="Minute" value={startMinute} onIncrement={() => setStartMinute(p => p === 0 ? 30 : 0)} onDecrement={() => setStartMinute(p => p === 0 ? 30 : 0)} /><span className="text-white text-4xl mx-4">-</span><NumberCircleInput label="Hour" value={endHour} onIncrement={() => setEndHour(p => (p + 1) % 24)} onDecrement={() => setEndHour(p => (p - 1 + 24) % 24)} /><span className="text-white text-4xl">:</span><NumberCircleInput label="Minute" value={endMinute} onIncrement={() => setEndMinute(p => p === 0 ? 30 : 0)} onDecrement={() => setEndMinute(p => p === 0 ? 30 : 0)} /></div><p className="text-center text-lg opacity-80 text-white mb-4">TEMPERATURE RANGE</p><div className="flex justify-center items-center gap-4 mb-8"><NumberCircleInput label="Temperature °C" value={lowTemp.toFixed(1)} onIncrement={() => setLowTemp(p => p + 0.5)} onDecrement={() => setLowTemp(p => p - 0.5)} /><span className="text-white text-4xl mx-4">-</span><NumberCircleInput label="Temperature °C" value={highTemp.toFixed(1)} onIncrement={() => setHighTemp(p => p + 0.5)} onDecrement={() => setHighTemp(p => p - 0.5)} /></div><div className="flex justify-center items-center gap-4"><button onClick={handleSave} className="font-bold py-3 px-10 rounded-full transition-transform hover:scale-105" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>SUBMIT</button><button onClick={() => onDelete(chunk)} disabled={isNew || isFirstChunk || isLastChunk} className="font-bold py-3 px-10 rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: PROFILE_COLORS.activeButton, color: PROFILE_COLORS.text }}>DELETE</button></div></div></div>);
};

const ErrorModal = ({ isOpen, onClose, message }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"><div className="w-full max-w-md rounded-2xl p-8 bg-white/20 backdrop-blur-md text-white"><h2 className="text-2xl font-bold text-center mb-4 text-red-300">Validation Error</h2><p className="text-center mb-6">{message}</p><div className="flex justify-center"><button onClick={onClose} className="font-bold py-2 px-8 rounded-full transition-transform hover:scale-105" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>OK</button></div></div></div>);};

const DaySelector = ({ days, activeDays, onToggleDay, disabled }) => (<div className={`flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-6 ${disabled ? 'opacity-70' : ''}`}>{days.map(day => { const isActive = activeDays.has(day); return (<div key={day} className={`flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !disabled && onToggleDay(day)}><span className="flex items-center justify-center h-8 w-8 rounded-full border-2 transition-colors" style={{ backgroundColor: isActive ? PROFILE_COLORS.activeButton : 'transparent', borderColor: PROFILE_COLORS.inactiveButtonBorder }}>{isActive && <div className="h-4 w-4 bg-white rounded-full" />}</span><label className={`ml-2 text-white font-medium ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>{DAY_ABBREVIATIONS[day]}</label></div>); })}</div>);

const CustomTooltip = ({ active, payload, chunks }) => {
    if (active && payload && payload.length) {
        const hoveredTime = payload[0].payload.FromTime;
        const currentChunk = chunks.find(chunk => hoveredTime >= chunk.x1 && hoveredTime <= chunk.x2);
        if (currentChunk) {
            const [endHourStr, endMinuteStr] = currentChunk.x2.split(':');
            let endHour = Number(endHourStr), endMinute = Number(endMinuteStr) + 30;
            if (endMinute >= 60) { endHour = (endHour + 1) % 24; endMinute -= 60; }
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
            return (<div className="bg-white/90 p-3 rounded-lg shadow-lg text-center"><p className="text-sm font-bold text-gray-700">{`${currentChunk.x1.slice(0, 5)} - ${endTime}`}</p><p className="text-xs text-gray-600">{`Temp: ${currentChunk.lowTemp}°C - ${currentChunk.highTemp}°C`}</p></div>);
        }
    } return null;
};

const DetailProfileChart = ({ data, onChunkClick, disabled }) => {
    const chunks = [];
    if (data && data.length > 0) {
        let chunkStartIndex = 0; let colorIndex = 0;
        for (let i = 1; i <= data.length; i++) {
            const endOfChunk = (i === data.length) || (Number(data[i].LowTemp) !== Number(data[i-1].LowTemp)) || (Number(data[i].HighTemp) !== Number(data[i-1].HighTemp));
            if (endOfChunk) {
                chunks.push({ x1: data[chunkStartIndex].FromTime, x2: data[i - 1].FromTime, lowTemp: data[chunkStartIndex].LowTemp, highTemp: data[chunkStartIndex].HighTemp, color: PROFILE_COLORS.redShades[colorIndex % PROFILE_COLORS.redShades.length] });
                chunkStartIndex = i; colorIndex++;
            }
        }
    }
    const chartData = data.map(record => ({ FromTime: record.FromTime, tempRange: [Number(record.LowTemp), Number(record.HighTemp)], color: chunks.find(c => record.FromTime >= c.x1 && record.FromTime <= c.x2)?.color || '#f06e6e' }));
    let minTemp = Math.min(...data.map(d => Number(d.LowTemp))), maxTemp = Math.max(...data.map(d => Number(d.HighTemp)));
    const yAxisDomain = (minTemp === Infinity) ? [0, 30] : [Math.floor(minTemp - 1), Math.ceil(maxTemp + 1)];
    const handleBarClick = (barData) => {
        if (!barData || disabled) return;
        const targetChunk = chunks.find(chunk => barData.FromTime >= chunk.x1 && barData.FromTime <= chunk.x2);
        if (targetChunk) onChunkClick(targetChunk, chunks.indexOf(targetChunk) === 0, chunks.indexOf(targetChunk) === chunks.length - 1);
    };
    return (
        <div className="w-full h-80 bg-white rounded-lg p-4 shadow-inner">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }} barCategoryGap={0}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" /><XAxis dataKey="FromTime" tickFormatter={(time) => time.slice(0, 5)} tick={{ fontSize: 10, fill: '#666' }} interval={5} /><YAxis tick={{ fontSize: 12, fill: '#666' }} domain={yAxisDomain} label={{ value: '°C', position: 'insideTopLeft', offset: -15, fill: '#666' }} /><Tooltip content={<CustomTooltip chunks={chunks} />} cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }} /><Bar dataKey="tempRange" onClick={handleBarClick} className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer>
        </div>
    );
};

const ActionButtons = ({ onSave, onNewPeriod, onDelete, isSaving, isDefault, isNew }) => (<div className="flex justify-center items-center gap-2 mt-6"><button onClick={onNewPeriod} disabled={isSaving} className="font-bold text-sm py-2 px-6 rounded-full transition-transform hover:scale-105 whitespace-nowrap disabled:opacity-50" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>NEW PERIOD</button><button onClick={onSave} disabled={isSaving} className="font-bold text-sm py-2 px-6 rounded-full transition-transform hover:scale-105 whitespace-nowrap disabled:opacity-50" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>{isSaving ? 'SAVING...' : 'SAVE PROFILE'}</button><button onClick={onDelete} disabled={isSaving || isDefault || isNew} className="font-bold text-sm py-2 px-6 rounded-full transition-transform hover:scale-105 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: PROFILE_COLORS.deleteButton, color: PROFILE_COLORS.deleteButtonText }}>DELETE PROFILE</button></div>);

const DragHandle = (props) => (<div {...props} className="w-10 h-full flex flex-col justify-center items-center cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/></svg></div>);

const TempRangeBadge = ({ min, max }) => (<div className="w-16 h-16 rounded-full flex flex-col justify-center items-center bg-white/10 text-white p-1 flex-shrink-0"><div className="flex items-center text-sm font-bold"><span className="text-xs mr-1">▲</span><span>{max === -Infinity ? '--' : max.toFixed(1)}</span></div><div className="w-3/4 h-[1px] bg-white/20 my-1"></div><div className="flex items-center text-sm font-bold"><span className="text-xs mr-1">▼</span><span>{min === Infinity ? '--' : min.toFixed(1)}</span></div></div>);

const ThumbnailChart = ({ data }) => {
    const chartData = data.map(r => ({ FromTime: r.FromTime, tempRange: [Number(r.LowTemp), Number(r.HighTemp)]}));
    const yDomain = [Math.min(...data.map(d=>Number(d.LowTemp)))-1, Math.max(...data.map(d=>Number(d.HighTemp)))+1];
    return (<div className="w-full h-full"><ResponsiveContainer><BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}><YAxis type="number" domain={yDomain} hide={true} /><Bar dataKey="tempRange" fill={PROFILE_COLORS.barColor} /></BarChart></ResponsiveContainer></div>);
};


// --- Page-level Components ---

const ProfileDetailPage = ({ profile, onBack, onSaveSuccess, isNew, allProfiles }) => {
    const isDefault = !isNew && profile.PriorityName?.includes('Default');
    const [originalProfileName, setOriginalProfileName] = useState(isNew ? null : profile.PriorityName);
    const [profileName, setProfileName] = useState(isNew ? "New Profile" : profile.PriorityName);
    const [fromDate, setFromDate] = useState(isNew ? new Date().toISOString().split('T')[0] : profile.FromDate);
    const [toDate, setToDate] = useState(isNew ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] : profile.ToDate);
    const [activeDays, setActiveDays] = useState(isNew ? new Set() : new Set(profile.DaysOfWeek));
    const [halfHourlyRecords, setHalfHourlyRecords] = useState(isNew ? Array.from({ length: 48 }, (_, i) => ({ FromTime: `${String(Math.floor(i/2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`, LowTemp: '18', HighTemp: '21' })) : profile.HalfHourlyRecords);
    const [isModalOpen, setIsModalOpen] = useState(false); const [selectedChunk, setSelectedChunk] = useState(null); const [isNewPeriod, setIsNewPeriod] = useState(false);
    const [isSaving, setIsSaving] = useState(false); const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' }); const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isNew) { setHasChanges(true); return; }
        const initialData = JSON.stringify({ name: profile.PriorityName, from: profile.FromDate, to: profile.ToDate, days: Array.from(new Set(profile.DaysOfWeek)), records: profile.HalfHourlyRecords });
        const currentData = JSON.stringify({ name: profileName, from: fromDate, to: toDate, days: Array.from(activeDays), records: halfHourlyRecords });
        setHasChanges(initialData !== currentData);
    }, [profileName, fromDate, toDate, activeDays, halfHourlyRecords, isNew, profile]);

    const handleToggleDay = (day) => { if (isDefault) return; setActiveDays(p => { const n = new Set(p); n.has(day) ? n.delete(day) : n.add(day); return n; }); };
    const handleChunkClick = (chunkData, isFirst, isLast) => { setSelectedChunk({ ...chunkData, isFirst, isLast }); setIsNewPeriod(false); setIsModalOpen(true); };
    const handleNewPeriod = () => { setSelectedChunk(null); setIsNewPeriod(true); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedChunk(null); setIsNewPeriod(false); };
    const handleModalSubmit = (updatedData) => {
        // FIX: Allow for periods that end at midnight (00:00)
        if (updatedData.startTime >= updatedData.endTime && updatedData.endTime !== '00:00') {
            setErrorModal({ isOpen: true, message: 'Start time must be before end time.' });
            return;
        }
        if ((Number(updatedData.highTemp) - Number(updatedData.lowTemp)) < 1) { 
            setErrorModal({ isOpen: true, message: 'Max temp must be at least 1 degree higher than min.' }); 
            return; 
        }
        setHalfHourlyRecords(c => c.map(r => (r.FromTime >= updatedData.startTime && r.FromTime < updatedData.endTime) ? { ...r, LowTemp: updatedData.lowTemp, HighTemp: updatedData.highTemp } : r));
        handleCloseModal();
    };
    const handleModalDelete = (chunkToDelete) => {
        setHalfHourlyRecords(currentRecords => {
            const startIndex = currentRecords.findIndex(r => r.FromTime === chunkToDelete.x1);
            if (startIndex <= 0) return currentRecords;
            const prevTemp = { LowTemp: currentRecords[startIndex - 1].LowTemp, HighTemp: currentRecords[startIndex - 1].HighTemp };
            return currentRecords.map(r => (r.FromTime >= chunkToDelete.x1 && r.FromTime <= chunkToDelete.x2) ? { ...r, ...prevTemp } : r);
        });
        handleCloseModal();
    };
    
    const handleSaveProfile = async () => {
        if(!isDefault) {
            const otherProfileNames = Object.values(allProfiles)
                .filter(p => p.ProfileKey !== profile.ProfileKey)
                .map(p => p.PriorityName);
            if(otherProfileNames.includes(profileName)) {
                setErrorModal({isOpen: true, message: "A profile with this name already exists. Please choose a unique name."});
                return;
            }
            if (new Date(fromDate) >= new Date(toDate)) {
                setErrorModal({isOpen: true, message: "The 'Active From' date must be before the 'Active To' date."});
                return;
            }
        }
        setIsSaving(true);
        const updatedProfileData = { 
            profileKey: isNew ? crypto.randomUUID() : profile.ProfileKey, 
            priorityNum: isNew ? Math.max(0, ...Object.values(allProfiles).map(p => Number(p.PriorityNum))) + 1 : profile.PriorityNum, 
            profileName,
            originalProfileName: isNew ? null : originalProfileName, // Add original name to payload
            fromDate, 
            toDate, 
            activeDays: Array.from(activeDays), 
            halfHourlyRecords 
        };
        try {
            const SAVE_API_URL = 'https://rcm4tg6vng.execute-api.eu-west-2.amazonaws.com/default/TempProfileUpdateAPIv2';
            const response = await fetchWithAuth(SAVE_API_URL, { method: 'POST', body: JSON.stringify(updatedProfileData) });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to save profile. Status: ${response.status}. Body: ${errorBody}`);
            }
            // ** FIX IS HERE: Removed alert **
            console.log('Profile saved successfully!');
            onSaveSuccess();
        } catch (error) { 
            console.error('Error saving profile:', error); 
            setErrorModal({isOpen: true, message: `Error saving profile: ${error.message}`});
        } finally { 
            setIsSaving(false); 
        }
    };

    const openDeleteConfirmation = () => { if (isDefault || isNew) return; setIsDeleteModalOpen(true); };
    const confirmDeleteProfile = async () => {
        setIsDeleteModalOpen(false); setIsSaving(true);
        try {
            const DELETE_API_URL = 'https://fa2tbi6j76.execute-api.eu-west-2.amazonaws.com/default/TempProfileDeleteAPIv2';
            const response = await fetchWithAuth(DELETE_API_URL, { method: 'POST', body: JSON.stringify({ profileKey: profile.ProfileKey, profileName: profile.PriorityName }) });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Failed to delete profile. Status: ${response.status}. Body: ${errorBody}`);
            }
            // ** FIX IS HERE: Removed alert **
            console.log('Profile deleted successfully!');
            onSaveSuccess();
        } catch (error) { 
            console.error('Error deleting profile:', error);
            setErrorModal({isOpen: true, message: `Error deleting profile: ${error.message}`});
        } finally { 
            setIsSaving(false); 
        }
    };
    const handleAttemptBack = () => { if (hasChanges && !isNew) { setIsDiscardModalOpen(true); } else { onBack(); } };

    return (
        <>
            <div className="w-full max-w-5xl mx-auto flex flex-col">
                <header className="w-full text-white">
                    <div className="flex justify-start items-center mb-4"><button onClick={handleAttemptBack} className="text-4xl opacity-80 hover:opacity-100 transition-opacity">&times;</button></div>
                    <div className="text-center">
                        <label className="text-lg opacity-80 font-semibold mb-1 block">Profile Name</label>
                        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} disabled={isDefault} className="w-full max-w-lg bg-white/20 text-2xl font-bold tracking-tight text-center text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed" />
                        <div className="mt-4 flex justify-center items-center gap-4">
                            <div><label className="text-lg opacity-80 font-semibold mb-1 block">Active From</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={isDefault} className="bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-2 disabled:opacity-70 disabled:cursor-not-allowed"/></div>
                            <div><label className="text-lg opacity-80 font-semibold mb-1 block">Active To</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={isDefault} className="bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-2 disabled:opacity-70 disabled:cursor-not-allowed"/></div>
                        </div>
                    </div>
                </header>
                <div style={{ backgroundColor: PROFILE_COLORS.card }} className="rounded-2xl p-6 shadow-2xl backdrop-blur-sm mt-6"><DaySelector days={ALL_DAYS_OF_WEEK} activeDays={activeDays} onToggleDay={handleToggleDay} disabled={isDefault} /><DetailProfileChart data={halfHourlyRecords} onChunkClick={handleChunkClick} disabled={isDefault} /></div>
                <ActionButtons onSave={handleSaveProfile} onNewPeriod={handleNewPeriod} onDelete={openDeleteConfirmation} isSaving={isSaving} isDefault={isDefault} isNew={isNew} />
            </div>
            <EditChunkModal isOpen={isModalOpen} chunk={selectedChunk} isNew={isNewPeriod} onClose={handleCloseModal} onSubmit={handleModalSubmit} onDelete={handleModalDelete} isFirstChunk={!isNewPeriod && selectedChunk?.isFirst} isLastChunk={!isNewPeriod && selectedChunk?.isLast} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteProfile} title="Delete Profile" message={`This will permanently remove the profile "${profileName}". Are you sure?`} confirmText="Yes, Delete" cancelText="No, Cancel" />
            <ErrorModal isOpen={errorModal.isOpen} onClose={() => setErrorModal({isOpen: false, message: ''})} message={errorModal.message} />
            <ConfirmationModal isOpen={isDiscardModalOpen} onClose={() => setIsDiscardModalOpen(false)} onConfirm={onBack} title="Unsaved Changes" message="You have unsaved changes. Are you sure you want to leave?" confirmText="Yes, Discard" cancelText="No, Stay" />
        </>
    );
};

const ProfileListItem = ({ profile, onSelect }) => {
    const temps = profile.HalfHourlyRecords.flatMap(r => [Number(r.LowTemp), Number(r.HighTemp)]);
    const minTemp = Math.min(...temps), maxTemp = Math.max(...temps);
    return (
        <div className="rounded-2xl p-2 shadow-lg backdrop-blur-sm flex items-center gap-4 opacity-80" style={{ backgroundColor: PROFILE_COLORS.card }} onClick={() => onSelect(profile.ProfileKey)}>
            <div className="w-10 flex-shrink-0"></div>
            <div className="flex-grow text-white cursor-pointer"><h3 className="font-bold text-lg truncate">{profile.PriorityName}</h3><p className="text-xs opacity-80">{profile.FromDate} to {profile.ToDate}</p><p className="text-xs opacity-60 mt-1">Default Profile (Locked)</p></div>
            <TempRangeBadge min={minTemp} max={maxTemp} />
            <div className="w-2/5 h-20 cursor-pointer"><ThumbnailChart data={profile.HalfHourlyRecords} /></div>
        </div>
    );
};

function SortableProfileListItem({ id, profile, onSelect }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: id});
    const style = { transform: CSS.Transform.toString(transform), transition, backgroundColor: PROFILE_COLORS.card };
    const temps = profile.HalfHourlyRecords.flatMap(r => [Number(r.LowTemp), Number(r.HighTemp)]);
    const minTemp = Math.min(...temps), maxTemp = Math.max(...temps);
    return (
        <div ref={setNodeRef} style={style} {...attributes} className="rounded-2xl p-2 shadow-lg backdrop-blur-sm transition-shadow flex items-center gap-4 touch-none">
            <DragHandle {...listeners} />
             <div className="flex-grow text-white cursor-pointer" onClick={() => onSelect(profile.ProfileKey)}><h3 className="font-bold text-xl truncate">{profile.PriorityName}</h3><p className="text-xs opacity-80">{profile.FromDate} to {profile.ToDate}</p><p className="text-xs opacity-60 mt-1">Priority: {profile.PriorityNum}</p></div>
            <TempRangeBadge min={minTemp} max={maxTemp} />
            <div className="w-2/5 h-20 cursor-pointer" onClick={() => onSelect(profile.ProfileKey)}><ThumbnailChart data={profile.HalfHourlyRecords} /></div>
        </div>
    );
}

const ProfileListPage = ({ profiles, onSelectProfile, onNewProfile }) => {
    const defaultProfile = Object.values(profiles).find(p => p.PriorityName?.includes('Default'));
    const otherProfiles = Object.values(profiles).filter(p => !p.PriorityName?.includes('Default'));
    const [sortedProfiles, setSortedProfiles] = useState(() => otherProfiles.sort((a, b) => Number(b.PriorityNum) - Number(a.PriorityNum)).map((p, i) => ({ ...p, PriorityNum: otherProfiles.length - i })));
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [isSaving, setIsSaving] = useState(false);

    async function handleDragEnd(event) {
        const { active, over } = event;
        if (active.id !== over.id) {
            let reorderedItems;
            setSortedProfiles((items) => {
                const oldIndex = items.findIndex(item => item.ProfileKey === active.id);
                const newIndex = items.findIndex(item => item.ProfileKey === over.id);
                reorderedItems = arrayMove(items, oldIndex, newIndex);
                return reorderedItems.map((item, index) => ({ ...item, PriorityNum: reorderedItems.length - index }));
            });
            
            setIsSaving(true);
            const payload = { profiles: reorderedItems.map((p, i) => ({ profileKey: p.ProfileKey, profileName: p.PriorityName, priorityNum: reorderedItems.length - i })) };
            try {
                const PRIORITY_API_URL = 'https://anp440nimj.execute-api.eu-west-2.amazonaws.com/default/TempProfilePriorityUpdateAPIv2';
                const response = await fetchWithAuth(PRIORITY_API_URL, { method: 'POST', body: JSON.stringify(payload) });
                if (!response.ok) throw new Error("Failed to save priority changes.");
            } catch (error) { 
                // Using the ErrorModal for consistency
                // setErrorModal({isOpen: true, message: "Could not save priority changes."});
                console.error("Could not save priority changes.", error);
            } finally { setIsSaving(false); }
        }
    }

    return (
        <div className={`w-full max-w-2xl mx-auto ${isSaving ? 'opacity-50' : ''}`}>
            <header className="text-center mb-10 text-white"><h1 className="text-5xl font-extrabold tracking-tight">All Temperature Profiles</h1><p className="text-lg opacity-80 mt-2">Drag and drop to reorder priority</p><button onClick={onNewProfile} className="mt-4 font-bold text-sm py-2 px-6 rounded-full transition-transform hover:scale-105" style={{ backgroundColor: PROFILE_COLORS.saveButton, color: PROFILE_COLORS.saveButtonText }}>NEW PROFILE</button></header>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><SortableContext items={sortedProfiles.map(p => p.ProfileKey)} strategy={verticalListSortingStrategy}><div className="flex flex-col gap-6">{sortedProfiles.map(profile => (<SortableProfileListItem key={profile.ProfileKey} id={profile.ProfileKey} profile={profile} onSelect={onSelectProfile} />))}</div></SortableContext></DndContext>
            {defaultProfile && (<div className="mt-6"><ProfileListItem profile={defaultProfile} onSelect={onSelectProfile} /></div>)}
        </div>
    );
};


// --- Main Exported Component ---
const ProfileSettingsPage = () => {
    const [page, setPage] = useState('list');
    const [profiles, setProfiles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const API_URL = 'https://wt999xvbu1.execute-api.eu-west-2.amazonaws.com/default/TempProfileDisplayAPIv2';
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetchWithAuth(API_URL, { method: 'GET' });
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const data = await response.json();
                
                // Check if body is a string and parse it, otherwise use data directly
                const profilesData = (data && typeof data.body === 'string') ? JSON.parse(data.body) : data;

                const transformedProfiles = Object.entries(profilesData).reduce((acc, [key, profile]) => {
                    acc[key] = { 
                        ...profile, 
                        HalfHourlyRecords: profile.HalfHourlyRecords.map(r => ({ 
                            FromTime: r.FromTime, 
                            LowTemp: r.TempDemandLow, 
                            HighTemp: r.TempDemandHigh 
                        })) 
                    };
                    return acc;
                }, {});

                setProfiles(transformedProfiles);

            } catch (err) { 
                setError(err.message);
                console.error("Error fetching or parsing profile data:", err);
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [refreshKey]);

    const handleSelectProfile = (profileId) => { setSelectedProfileId(profileId); setIsCreating(false); setPage('detail'); };
    const handleNewProfile = () => { setSelectedProfileId(null); setIsCreating(true); setPage('detail'); };
    const handleReturnToList = () => { setPage('list'); setSelectedProfileId(null); setIsCreating(false); };
    const handleSaveSuccess = () => { setRefreshKey(prevKey => prevKey + 1); handleReturnToList(); };

    const renderPage = () => {
        switch (page) {
            case 'list':
                if (loading) return <div className="text-2xl font-semibold text-white">Loading Profiles...</div>;
                if (error) return <div className="text-red-300">Error: {error}</div>;
                return <ProfileListPage profiles={profiles || {}} onSelectProfile={handleSelectProfile} onNewProfile={handleNewProfile} />;
            case 'detail':
                const profileData = isCreating ? null : profiles?.[selectedProfileId];
                if (isCreating) {
                     return <ProfileDetailPage 
                                profile={{ PriorityName: 'New Profile', DaysOfWeek: [], HalfHourlyRecords: [] }} 
                                isNew={true} 
                                allProfiles={profiles}
                                onBack={handleReturnToList} 
                                onSaveSuccess={handleSaveSuccess} 
                            />;
                }
                if (selectedProfileId && profileData) {
                     return <ProfileDetailPage 
                                profile={profileData} 
                                isNew={false} 
                                allProfiles={profiles}
                                onBack={handleReturnToList} 
                                onSaveSuccess={handleSaveSuccess} 
                            />;
                }
                if (loading) return <div className="text-2xl font-semibold text-white">Loading Profile...</div>;
                setPage('list'); // Fallback if data is missing
                return null;
            default:
                return <ProfileListPage profiles={profiles || {}} onSelectProfile={handleSelectProfile} onNewProfile={handleNewProfile} />;
        }
    };
    
    return (
        <div style={{ backgroundColor: PROFILE_COLORS.background }} className="min-h-screen w-full font-sans p-4 sm:p-8 flex items-start justify-center">
            {renderPage()}
        </div>
    );
};

export default ProfileSettingsPage;
