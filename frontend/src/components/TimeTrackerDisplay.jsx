import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import api from '@/lib/api';

export default function TimeTrackerDisplay() {
    const [activeSeconds, setActiveSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const accumulatedRef = useRef(0);
    const timerRef = useRef(null);

    // Fetch initial time for today
    useEffect(() => {
        const fetchInitialTime = async () => {
            try {
                const data = await api.get('/time-tracking/me');
                if (data.success) {
                    setActiveSeconds(data.activeSeconds || 0);
                }
            } catch (err) {
                console.error("Failed to fetch initial time", err);
            }
        };
        fetchInitialTime();
    }, []);

    // Handle visibility and focus changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && document.hasFocus()) {
                setIsActive(true);
            } else {
                setIsActive(false);
            }
        };

        const handleFocus = () => setIsActive(true);
        const handleBlur = () => setIsActive(false);

        // Initial check
        handleVisibilityChange();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Timer and Ping Logic
    useEffect(() => {
        if (!isActive) return;

        timerRef.current = setInterval(() => {
            setActiveSeconds(prev => prev + 1);
            accumulatedRef.current += 1;

            // Ping every 15 seconds
            if (accumulatedRef.current >= 15) {
                const increment = accumulatedRef.current;
                accumulatedRef.current = 0; // reset early to avoid double send on slow network

                api.post('/time-tracking/ping', { incrementSeconds: increment })
                    .catch(err => {
                        console.error("Failed to ping time", err);
                        // If it fails, we add it back so it gets sent next time
                        accumulatedRef.current += increment;
                    });
            }
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isActive]);

    // Format seconds to HH:MM:SS
    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m}m ${s}s`;
    };

    return (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
            <Clock size={12} />
            <span>{formatTime(activeSeconds)} {isActive ? '(Active)' : '(Paused)'}</span>
        </div>
    );
}
