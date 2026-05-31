import { useEffect, useRef } from "react";

// A hook that calls a function right away, then keeps calling it every X milliseconds
// I use this on the Game page to check if someone joined the match every 15 seconds
export function usePolling(callBack, interval) {
    // I store the callback in a ref so the interval always has the latest version of the function
    // If I didn't do this and the callback changed, the interval would keep calling the old one
    const callBackRef = useRef(callBack);
    callBackRef.current = callBack;

    useEffect(() => {
        // running prevents a new tick from starting if the previous fetch hasn't finished yet
        let running = false;

        async function tick() {
            // Skip this tick if the previous one is still in progress
            if (running) return;
            running = true;
            await callBackRef.current();
            running = false;
        }

        tick();
        const timer = setInterval(tick, interval);
        return () => clearInterval(timer);
    }, []);
}
