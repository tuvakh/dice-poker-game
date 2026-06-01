// The address of our backend server — all API files import this so we only have to change it in one place
export const BASE_URL = "http://localhost:3000";

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise = null;

// Attempt to refresh the access token using the refresh token
async function refreshAccessToken() {
    if (isRefreshing) {
        // If already refreshing, wait for the promise to resolve
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
                // Refresh token invalid or expired - user must log in again
                // Clear any stored auth state
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

// Wrapper for fetch that includes credentials (for JWT cookie authentication)
// Automatically attempts to refresh the access token if it's expired (401 response)
export async function fetchWithAuth(url, options = {}) {
    let res = await fetch(url, {
        ...options,
        credentials: 'include', // Send cookies with every request
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    // If we get a 401, try refreshing the access token once
    if (res.status === 401 && !isRefreshing) {
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
            // Try the original request again with the new access token
            res = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
        }
    }
    
    return res;
}

// Every API call goes through this function after getting a response
export async function handleResponse(res) {
    // If something went wrong, it reads the error from the backend and throws it 
    if (!res.ok) {
        // Try to read the error message from the response body, fall back to a generic message
        const body = await res.json().catch(() => ({}));
        const error = new Error(body.message || body.errors?.[0]?.msg || "Something went wrong");
        // If the backend sent back field-specific errors it can get showed under the right input
        if (body.errors) {
            error.fieldErrors = Object.fromEntries(
                body.errors.map(event => [event.path, event.msg])
            );
        }
        throw error;
    }
    return res.json();
}
