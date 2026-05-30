// The address of our backend server — all API files import this so we only have to change it in one place
export const BASE_URL = "http://localhost:3000";

// Checks if a user is logged in and returns the right header so the backend knows who is making the request
// If no one is logged in, we return an empty object (no header sent)
export function getAuthHeaders() {
    const saved = sessionStorage.getItem("user");
    if (!saved) return {};
    const user = JSON.parse(saved);
    return { "X-User-Role": user.role || "user" };
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
