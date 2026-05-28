import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

// Fetches a single user's profile by their userId
export async function getUser(id) {
    const res = await fetch(`${BASE_URL}/users/${id}`);
    return handleResponse(res);
}

// Registers a new user account
// data contains username, password, email, dateOfBirth, etc.
export async function createUser(data) {
    const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Logs in a user and returns their profile data
// data contains username and password
export async function loginUser(data) {
    const res = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Updates a user's profile
// Handles two cases: plain text updates and file uploads (profile image)
// FormData is used when uploading a file because it needs a different Content-Type header
export async function updateUser(id, data) {
    // Check if data is a file upload or a plain object
    const isFormData = data instanceof FormData;
    const res = await fetch(`${BASE_URL}/users/${id}`, {
        method: "PUT",
        // For FormData, we skip Content-Type so the browser sets it automatically 
        // For plain objects, we set it to JSON manually
        headers: isFormData
            ? { ...getAuthHeaders() }
            : { "Content-Type": "application/json", ...getAuthHeaders() },
        body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(res);
}

// Verifies an email using the token sent to the user's inbox
export async function verifyEmail(token) {
    const res = await fetch(`${BASE_URL}/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return handleResponse(res);
}

// Requests a password reset email
export async function forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    return handleResponse(res);
}

// Resets the password using the code from the email link
export async function resetPassword(code, password) {
    console.log("[API] Resetting password");
    console.log("[API] Code length:", code?.length);
    console.log("[API] Password length:", password?.length);
    console.log("[API] Password chars:", password?.split('').map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
    
    const res = await fetch(`${BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password })
    });
    const result = await handleResponse(res);
    console.log("[API] Reset password response:", result);
    return result;
}
