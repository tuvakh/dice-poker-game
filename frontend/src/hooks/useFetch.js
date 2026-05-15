import { useState, useEffect } from "react";

// A reusable hook that handles fetching data from the backend
// Instead of writing loading/error state in every component, I use this hook and get back both data, loading and error

// fetchFn is the function to call
// deps re-fetches when any value in the array changes
export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // This flag prevents a bug where the component is gone before the fetch finishes
        // It cancels the fetching if the user moves to another page before it's finished 
        let cancelled = false;

        // Reset state before each new fetch so old data doesn't flash on screen
        setLoading(true);
        setError(null);

        fetchFn()
            // If the fetch succeeds, save the result
            .then(result => { if (!cancelled) setData(result); })
            // If the fetch fails, save the error message to show to the user
            .catch(err => { if (!cancelled) setError(err.message); })
            // Always turn off the loading spinner when done, whether it succeeded or failed
            .finally(() => { if (!cancelled) setLoading(false); });

        // This runs when the component unmounts or before the next re-fetch
        // Setting cancelled = true tells all the handlers above to do nothing
        return () => { cancelled = true; };
    }, deps);

    return { data, loading, error };
}
