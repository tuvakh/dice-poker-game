import { useState, useEffect } from "react";

export function useFetch(fetchFn, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;

        setLoading(true);
        setError(null);

        Promise.resolve(fetchFn(controller.signal))
            .then(result => { if (!cancelled) setData(result); })
            .catch(err => {
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
