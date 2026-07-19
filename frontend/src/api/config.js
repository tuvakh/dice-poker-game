export const BASE_URL = import.meta.env.VITE_API_URL;

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${BASE_URL}/users/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) {
                sessionStorage.removeItem('user');
                window.location.href = '/login';
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            sessionStorage.removeItem('user');
            window.location.href = '/login';
            return false;
        } finally {
            isRefreshing = false;
        }
    })();

    return refreshPromise;
}