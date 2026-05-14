import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, MapPin, CheckCircle2, AlertCircle, RefreshCw, User, Lock, ShieldCheck, Fingerprint } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const currentHost = window.location.hostname;
// Force current host for API during dev testing
const API_URL = `http://${currentHost}:8080/api/v1`;

export default function PublicCheckIn() {
    const { tenantCode } = useParams();
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [pin, setPin] = useState('');
    const [location, setLocation] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('IDLE'); // IDLE, SUCCESS, ERROR
    const [settings, setSettings] = useState({ isGpsMandatory: false, isSelfieMandatory: false });

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);

    useEffect(() => {
        // toast.success(`Target API: ${API_URL}`, { duration: 5000 });
        fetchStaff();
        fetchSettings();
        requestLocation();
    }, [tenantCode, fetchStaff, fetchSettings]);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/public/attendance/settings/${tenantCode}`);
            setSettings(res.data.data || { isGpsMandatory: false, isSelfieMandatory: false });
        } catch (err) {
            console.error('Settings load error:', err);
        }
    }, [tenantCode]);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/public/attendance/staff/${tenantCode}`);
            setStaffList(res.data.data || []);
        } catch (err) {
            console.error('Staff load error:', err);
            toast.error(`Error: ${err.message || 'Could not load staff list'}`);
        }
    }, [tenantCode]);

    const requestLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation(`${pos.coords.latitude},${pos.coords.longitude}`),
                () => console.warn('Location access denied. Continuing without GPS.')
            );
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch {
            toast.error('Camera access denied');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setPhoto(dataUrl);

            // Stop camera
            const stream = videoRef.current.srcObject;
            stream.getTracks().forEach(track => track.stop());
            setCameraActive(false);
        }
    };

    const handleBiometric = async () => {
        if (!selectedStaff) {
            toast.error('Please select your name first');
            return;
        }

        toast.loading('Initializing Biometric Scanner...', { id: 'bio' });
        
        try {
            // 1. Check if staff has biometric registered
            const checkRes = await axios.get(`http://${currentHost}:8080/api/v1/public/biometric/check/${selectedStaff}`);
            if (!checkRes.data.data.hasBiometric) {
                toast.error('No biometrics registered for this staff member', { id: 'bio' });
                return;
            }

            const credentialIdStr = checkRes.data.data.credentialId;
            // Convert Base64 back to Buffer
            const credentialId = Uint8Array.from(atob(credentialIdStr), c => c.charCodeAt(0));

            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const options = {
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{
                        id: credentialId,
                        type: 'public-key'
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            };

            const assertion = await navigator.credentials.get(options);
            
            if (assertion) {
                // In a real app, we would send 'assertion' to backend to verify signature.
                // For this demo, since we got a valid assertion from the hardware, we fetch the PIN 
                // from the staff list (which we included earlier) and auto-fill it.
                const staff = staffList.find(s => s.id === parseInt(selectedStaff));
                setPin(staff.pin);
                toast.success('Identity Verified via Biometrics!', { id: 'bio' });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.name === 'NotAllowedError' ? 'Security access denied' : 'Biometric Verification Failed. Ensure HTTPS.', { id: 'bio' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaff || !pin) {
            toast.error('Name and PIN are required');
            return;
        }

        // Enforce Owner Settings
        if (settings.isSelfieMandatory && !photo) {
            toast.error('Selfie is required for attendance');
            return;
        }

        if (settings.isGpsMandatory && !location) {
            toast.error('GPS Location is required for attendance');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/public/attendance/mark`, {
                staffId: selectedStaff,
                tenantCode,
                pin,
                photoBase64: photo || 'DEV_BYPASS',
                location: location || '0.0,0.0',
                notes: 'Marked via Secure QR'
            });
            setStatus('SUCCESS');
            toast.success('Attendance Marked!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm w-full space-y-6">
                    <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-3xl font-semibold text-slate-900 uppercase tracking-tighter">Attendance Logged!</h1>
                    <p className="text-slate-500 font-bold">Have a great work day. You can now close this tab.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold uppercase tracking-widest mt-8"
                    >
                        Back to Check-in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck size={120} />
                    </div>
                    <h1 className="text-2xl font-semibold uppercase tracking-tighter relative z-10">Secure Check-In</h1>
                    <p className="text-[14px] font-semibold uppercase tracking-[0.3em] text-slate-400 mt-2 relative z-10">BizFlow Attendance Hub</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Identity Selection</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold appearance-none"
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                            >
                                <option value="">Select your name...</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Verification (PIN or Thumb)</label>
                            <button
                                type="button"
                                onClick={handleBiometric}
                                className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[14px] font-semibold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                            >
                                <Fingerprint size={12} />
                                Scan Thumb
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                maxLength={4}
                                required
                                placeholder="••••"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-lg tracking-[1em]"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Visual Verification (Selfie)</label>
                            {settings.isSelfieMandatory && <span className="text-[14px] font-semibold bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Required</span>}
                        </div>
                        {!photo ? (
                            <div className="relative h-64 w-full bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                                {cameraActive ? (
                                    <div className="relative w-full h-full">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 p-4 rounded-full shadow-xl hover:scale-110 transition-transform"
                                        >
                                            <Camera size={24} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                                            <Camera size={28} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="text-[14px] font-semibold text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            Activate Camera
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative h-64 w-full rounded-3xl overflow-hidden shadow-lg border-4 border-white group">
                                <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setPhoto(null)}
                                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                                >
                                    <RefreshCw className="mb-2" />
                                    <span className="text-[14px] font-semibold uppercase tracking-widest">Retake Photo</span>
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className={location ? "text-emerald-500" : "text-amber-500 animate-pulse"} />
                            <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">
                                {location ? "GPS Locked" : "Acquiring GPS Signal..."}
                            </span>
                        </div>
                        {settings.isGpsMandatory && !location && (
                            <span className="text-[14px] font-semibold text-rose-500 uppercase tracking-widest">Required</span>
                        )}
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-semibold uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : "Submit Attendance"}
                    </button>
                </form>
            </div>
        </div>
    );
}
