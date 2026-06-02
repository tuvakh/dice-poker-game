import { useEffect, useRef } from "react";

// Calls callback immediately then repeats every interval ms; pass enabled=false to pause
// callback receives an AbortSignal so in-flight requests are cancelled when the interval restarts
export function usePolling(callBack, interval, enabled = true) {
    // Ref trick: store the latest callback in a ref so the effect never needs it as a dependency
    // Without this, adding callback to deps would restart the interval on every render
    const callBackRef = useRef(callBack);
    callBackRef.current = callBack;

    useEffect(() => {
        if (!enabled) return;

        // running flag prevents overlapping calls if one tick takes longer than the interval
        let running = false;
        let controller = new AbortController();

        async function tick() {
            if (running) return;
            running = true;
            // New controller per tick so each call gets its own signal to abort
            controller = new AbortController();
            try {
                await callBackRef.current(controller.signal);
            } catch (err) {
                if (err?.name === "AbortError") return;
                // Other errors are handled inside the callback itself
            } finally {
                running = false;
            }
        }

        tick();
        const timer = setInterval(tick, interval);

        // Cleanup: stop the interval and cancel any in-flight request
        return () => {
            clearInterval(timer);
            controller.abort();
        };
    }, [enabled, interval]);
}
