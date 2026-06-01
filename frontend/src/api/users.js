import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches a single user's profile by their userId
export async function getUser(id) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${id}`);
    return handleResponse(res);
}

// Registers a new user account
// data contains username, password, email, dateOfBirth, etc.
export async function createUser(data) {
    const res = await fetchWithAuth(`${BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Logs in a user and returns their profile data
// data contains username and password
export async function loginUser(data) {
    const res = await fetchWithAuth(`${BASE_URL}/users/login`, {
        method: "POST",
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
    const res = await fetchWithAuth(`${BASE_URL}/users/${id}`, {
        method: "PUT",
        // For FormData, don't set Content-Type so the browser sets it with the boundary
        headers: isFormData ? {} : {},
        body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(res);
}

// Verifies an email using the token sent to the user's inbox
export async function verifyEmail(token) {
    const res = await fetchWithAuth(`${BASE_URL}/users/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ token })
    });
    return handleResponse(res);
}

// Requests a password reset email
export async function forgotPassword(email) {
    const res = await fetchWithAuth(`${BASE_URL}/users/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
    return handleResponse(res);
}

// Resets the password using the code from the email link
export async function resetPassword(code, password) {
    const res = await fetchWithAuth(`${BASE_URL}/users/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ code, password })
    });
    const result = await handleResponse(res);
    return result;
}
