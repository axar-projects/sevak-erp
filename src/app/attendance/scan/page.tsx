"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { markAttendance } from "@/actions/attendance-actions";

export default function AttendanceScanner() {
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; user?: any; status?: string } | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // Initialize Scanner
        const startScanner = async () => {
            try {
                // Ensure element exists
                if (!document.getElementById("reader")) return;

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        handleAttendance(decodedText);
                    },
                    (errorMessage) => {
                        // ignore scan errors (no QR code found)
                    }
                );
            } catch (err) {
                console.error("Camera start error:", err);
                setError("Failed to access camera. Please ensure you have granted camera permissions. Error: " + err);
                setIsScanning(false);
            }
        };

        const timer = setTimeout(startScanner, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Stop failed", err));
            }
        };
    }, []);

    const handleAttendance = async (userId: string) => {
        if (!scannerRef.current) return;
        
        // Pause scanning to process
        try {
             await scannerRef.current.pause();
        } catch(e) { console.warn("Pause failed", e); }
        
        setIsScanning(false);

        const result = await markAttendance(userId);
        setScanResult(result);
    };

    const resetScanner = async () => {
        setScanResult(null);
        setIsScanning(true);
        if (scannerRef.current) {
            try {
                await scannerRef.current.resume();
            } catch (e) {
                 console.warn("Resume failed, restarting", e);
                 // Reload page as fallback if resume fails often
                 window.location.reload();
            }
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 flex flex-col items-center gap-6 min-h-screen">
            <h1 className="text-2xl font-bold text-center">Scan Attendance</h1>
            
            {/* Error Message */}
            {error && (
                <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                    <p className="font-bold">Camera Error</p>
                    <p className="text-sm">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-2 text-xs underline">Retry</button>
                </div>
            )}

            {/* Scanner Container */}
            <div className={`w-full bg-black rounded-lg overflow-hidden relative ${!isScanning && "hidden"}`} style={{ minHeight: "300px" }}>
                 <div id="reader" className="w-full h-full"></div>
                 {isScanning && !error && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="w-64 h-64 border-2 border-white/50 rounded-lg"></div>
                     </div>
                 )}
            </div>

            {/* Result Display */}
            {!isScanning && scanResult && (
                <div className={`w-full p-6 rounded-xl shadow-lg border text-center flex flex-col items-center gap-4 ${
                    scanResult.success 
                        ? scanResult.message.includes("already") ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                }`}>
                    
                    {scanResult.success ? (

                         <>
                            <div className={`w-24 h-24 rounded-full overflow-hidden mb-2 border-4 ${scanResult.status === 'duplicate' ? 'border-orange-400' : 'border-green-500'}`}>
                                {scanResult.user?.imageUrl ? (
                                    <img src={scanResult.user.imageUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-200">👤</div>
                                )}
                            </div>
                            <h2 className="text-xl font-bold">{scanResult.user?.name}</h2>
                            <p className="text-muted-foreground">{scanResult.user?.seva}</p>
                            
                            {scanResult.status === 'duplicate' ? (
                                <div className="mt-4 flex flex-col items-center animate-pulse">
                                    <span className="text-4xl">⚠️</span>
                                    <div className="px-6 py-2 rounded-full font-bold mt-2 bg-orange-100 text-orange-700 border border-orange-200">
                                        ALREADY SCANNED TODAY
                                    </div>
                                    <p className="text-xs text-orange-600 mt-1">Attendance was already marked previously</p>
                                </div>
                            ) : (
                                <div className="mt-4 flex flex-col items-center">
                                    <span className="text-4xl">✅</span>
                                    <div className="px-6 py-2 rounded-full font-bold mt-2 bg-green-100 text-green-700 border border-green-200">
                                        ATTENDANCE MARKED
                                    </div>
                                </div>
                            )}
                         </>
                    ) : (
                        <>
                            <div className="text-4xl">❌</div>
                            <h2 className="text-xl font-bold text-red-700">Error</h2>
                            <p className="text-red-600">{scanResult.message}</p>
                        </>
                    )}

                    <button 
                        onClick={resetScanner}
                        className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
                    >
                        Scan Next
                    </button>
                </div>
            )}

            <div className="text-xs text-muted-foreground text-center mt-auto pb-4">
                Point camera at QR code on ID card
            </div>
        </div>
    );
}
