import { useEffect, useRef } from "react";

// A hook that calls a function right away, then keeps calling it every X milliseconds
// Pass enabled=false to pause polling (e.g. when a WebSocket takes over)
// The callback receives an AbortSignal so in-flight requests are cancelled on cleanup
export function usePolling(callBack, interval, enabled = true) {
    const callBackRef = useRef(callBack);
    callBackRef.current = callBack;

    useEffect(() => {
        if (!enabled) return;

        let running = false;
        let controller = new AbortController();

        async function tick() {
            if (running) return;
            running = true;
            controller = new AbortController();
            try {
                await callBackRef.current(controller.signal);
            } catch (err) {
                // AbortError is expected on cleanup — ignore it
                if (err?.name === "AbortError") return;
                // Other errors are handled inside the callback itself
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
