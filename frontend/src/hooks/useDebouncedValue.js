import { useEffect, useState } from "react";

// Returns a version of value that only updates after delay ms of no new changes
// Used to avoid firing an API call on every keystroke in search inputs
export function useDebouncedValue(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        // Cleanup: if value changes again before delay ms pass, cancel the previous timer
        // This means setDebouncedValue only runs when the user pauses typing
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
