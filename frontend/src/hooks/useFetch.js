import { useState, useEffect } from "react";

// Reusable data-fetching hook that manages loading, error, and data state
// fetchFn receives an AbortSignal; deps re-triggers the fetch when any value in the array changes
export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // AbortController cancels in-flight requests when the component unmounts or deps change
        const controller = new AbortController();
        // cancelled flag stops state updates if the response arrives after cleanup has run
        let cancelled = false;

        // Reset before each fetch so stale data doesn't flash while the new request is in flight
        setLoading(true);
        setError(null);

        // Promise.resolve() wraps the result in case fetchFn returns a plain value instead of a Promise
        Promise.resolve(fetchFn(controller.signal))
            .then(result => { if (!cancelled) setData(result); })
            .catch(err => {
                // AbortError is expected when the request is cancelled — not a real error
                if (cancelled || err.name === "AbortError") return;
                setError(err.message);
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, deps);

    return { data, loading, error };
}
