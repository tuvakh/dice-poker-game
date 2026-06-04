import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

export async function getUser(id) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${id}`);
    return handleResponse(res);
}

export async function createUser(data) {
    const res = await fetchWithAuth(`${BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function loginUser(data) {
    const res = await fetchWithAuth(`${BASE_URL}/users/login`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}
export async function updateUser(id, data) {
    const isFormData = data instanceof FormData;
    const res = await fetchWithAuth(`${BASE_URL}/users/${id}`, {
        method: "PUT",
        body: isFormData ? data : JSON.stringify(data)
    });
    return handleResponse(res);
}

export async function verifyEmail(token) {
    const res = await fetchWithAuth(`${BASE_URL}/users/verify-email`, {
        method: 'POST',
        body: JSON.stringify({ token })
    });
    return handleResponse(res);
}

export async function forgotPassword(email) {
    const res = await fetchWithAuth(`${BASE_URL}/users/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
    return handleResponse(res);
}

export async function resendVerificationEmail(email) {
    const res = await fetchWithAuth(`${BASE_URL}/users/resend-verification`, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
    return handleResponse(res);
}

export async function resetPassword(code, password) {
    const res = await fetchWithAuth(`${BASE_URL}/users/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ code, password })
    });
    return handleResponse(res);
}
