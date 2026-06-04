import { useEffect, useRef } from "react";

export function usePolling(callback, interval, enabled = true) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        if (!enabled) return;

        let running = false;
        let controller = new AbortController();

        async function tick() {
            if (running) return;
            running = true;
            controller = new AbortController();
            try {
                await callbackRef.current(controller.signal);
            } catch (err) {
                if (err?.name === "AbortError") return;
            } finally {
                running = false;
            }
        }

        tick();
        const timer = setInterval(tick, interval);

        return () => {
            clearInterval(timer);
            controller.abort();
        };
    }, [enabled, interval]);
}
