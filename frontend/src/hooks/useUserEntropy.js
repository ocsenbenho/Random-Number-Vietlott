import { useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3000';
const SEND_INTERVAL = 2000; // Send entropy every 2 seconds

/**
 * Hook to collect user entropy from mouse movements and keyboard timing
 * Sends data to backend to mix into the entropy pool
 */
export function useUserEntropy(enabled = true) {
    const entropyBuffer = useRef([]);
    const lastSendTime = useRef(0);

    const sendEntropy = useCallback(async () => {
        if (entropyBuffer.current.length === 0) return;

        const data = entropyBuffer.current.shift();
        if (!data) return;

        try {
            await fetch(`${API_BASE_URL}/entropy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (err) {
            // Silently fail - entropy collection is best-effort
        }
    }, []);

    const handleMouseMove = useCallback((e) => {
        const now = Date.now();
        if (now - lastSendTime.current < 100) return; // Throttle

        lastSendTime.current = now;
        entropyBuffer.current.push({
            mouseX: e.clientX,
            mouseY: e.clientY,
            timestamp: now
        });

        // Send if buffer has enough data
        if (entropyBuffer.current.length >= 5) {
            sendEntropy();
        }
    }, [sendEntropy]);

    const handleKeyDown = useCallback((e) => {
        const now = Date.now();
        entropyBuffer.current.push({
            keyTiming: now % 256,
            timestamp: now
        });
    }, []);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('keydown', handleKeyDown, { passive: true });

        // Periodic send
        const interval = setInterval(sendEntropy, SEND_INTERVAL);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(interval);
        };
    }, [enabled, handleMouseMove, handleKeyDown, sendEntropy]);

    return {
        entropyCollected: entropyBuffer.current.length > 0
    };
}

export default useUserEntropy;
