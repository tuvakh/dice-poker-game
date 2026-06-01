import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

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

export async function banUser(userId) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/ban`, {
        method: 'PUT'
    });
    return handleResponse(res);
}

export async function unbanUser(userId) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/unban`, {
        method: 'PUT'
    });
    return handleResponse(res);
}

export async function changeRole(userId, role) {
    const res = await fetchWithAuth(`${BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
    return handleResponse(res);
}

export default { getUsers, banUser, unbanUser, changeRole };
