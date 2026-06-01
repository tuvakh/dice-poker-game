import { BASE_URL, handleResponse, fetchWithAuth } from "./config.js";

// Fetches a list of comments, with optional filters for target, search, and pagination
export async function getAllComments({ page, limit, search, targetId, targetType } = {}, signal) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);
    if (search) params.append("search", search);
    if (targetId) params.append("targetId", targetId);
    if (targetType) params.append("targetType", targetType);

    const res = await fetchWithAuth(`${BASE_URL}/comments?${params}`, { signal });
    return handleResponse(res);
}

// Creates a new comment
export async function createComment(data) {
    const res = await fetchWithAuth(`${BASE_URL}/comments`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return handleResponse(res);
}

// Deletes a comment by commentId (admin only)
export async function deleteComment(commentId) {
    const res = await fetchWithAuth(`${BASE_URL}/comments/${commentId}`, {
        method: "DELETE"
    });
    return handleResponse(res);
}
