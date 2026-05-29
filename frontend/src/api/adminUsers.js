import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

export async function getUsers({ page = 1, limit = 10, search = "" } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const res = await fetch(`${BASE_URL}/users?${params.toString()}`, {
        headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
}

export async function banUser(userId) {
    const res = await fetch(`${BASE_URL}/users/${userId}/ban`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
}

export async function unbanUser(userId) {
    const res = await fetch(`${BASE_URL}/users/${userId}/unban`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return handleResponse(res);
}

export async function changeRole(userId, role) {
    const res = await fetch(`${BASE_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
    });
    return handleResponse(res);
}

export default { getUsers, banUser, unbanUser, changeRole };
