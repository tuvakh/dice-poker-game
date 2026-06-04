export const BASE_URL = 'http://localhost:3000';

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

export async function fetchWithAuth(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    let res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: isFormData
            ? { ...options.headers }
            : {
                  'Content-Type': 'application/json',
                  ...options.headers
              }
    });

    if (res.status === 401 && !isRefreshing && !url.includes('/users/login') && !url.includes('/users/refresh')) {
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            res = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: isFormData
                    ? { ...options.headers }
                    : {
                          'Content-Type': 'application/json',
                          ...options.headers
                      }
            });
        }
    }

    return res;
}

export async function handleResponse(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const error = new Error(body.message || body.errors?.[0]?.msg || 'Something went wrong');
        if (body.errors) {
            error.fieldErrors = Object.fromEntries(body.errors.map((fieldError) => [fieldError.path, fieldError.msg]));
        }
        throw error;
    }
    return res.json();
}
