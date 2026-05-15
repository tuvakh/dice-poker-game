import { useEffect, useRef } from "react";

// A hook that calls a function right away, then keeps calling it every X milliseconds
// I use this on the Game page to check if someone joined the match every 15 seconds
export function usePolling(callBack, interval) {
    // I store the callback in a ref so the interval always has the latest version of the function
    // If I didn't do this and the callback changed, the interval would keep calling the old one
    const callBackRef = useRef(callBack);
    callBackRef.current = callBack;

    useEffect(() => {
        // Call it once immediately so there's no wait on first load
        callBackRef.current();

        // Then set up a repeating timer (interval is in milliseconds)
        const timer = setInterval(() => callBackRef.current(), interval);

        // When the user navigates away from the page, stop the timer
        return () => clearInterval(timer);
    }, []);
}
