import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches a paginated, searchable list of all users — used by the admin user management panel
export async function getUsers({ page = 1, limit = 10, search = "" } = {}, signal) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const res = await fetchWithAuth(`${BASE_URL}/users?${params.toString()}`, {
        signal
    });
    return handleResponse(res);
}

// Bans a user, preventing them from logging in
export async function banUser(userId) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/ban`, {
        method: 'PUT'
    });
    return handleResponse(res);
}

// Reverses a ban, restoring the user's access
export async function unbanUser(userId) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/unban`, {
        method: 'PUT'
    });
    return handleResponse(res);
}

// Changes a user's role (e.g. user → admin)
export async function changeRole(userId, role) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
    return handleResponse(res);
}
