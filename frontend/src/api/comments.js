import { BASE_URL, handleResponse, getAuthHeaders } from "./config.js";

// Fetches a list of comments, with optional filters for target, search, and pagination
export async function getAllComments({ page, limit, search, targetId, targetType } = {}) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("search", search);
    if (targetId) params.append("targetId", targetId);
    if (targetType) params.append("targetType", targetType);

    const res = await fetch(`${BASE_URL}/comments?${params}`);
    return handleResponse(res);
}

// Creates a new comment
export async function createComment(data) {
    const res = await fetch(`${BASE_URL}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Deletes a comment by commentId (admin only)
export async function deleteComment(commentId) {
    const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
}
