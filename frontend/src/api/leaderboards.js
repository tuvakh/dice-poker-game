import { BASE_URL, handleResponse } from "./config.js";

export async function getRankings({ page = 1, limit = 10, sortBy, category } = {}) {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sortBy) params.set("sortBy", sortBy);
    if (category) params.set("category", category);

    const res = await fetch(`${BASE_URL}/leaderboards?${params.toString()}`);
    return handleResponse(res);
}
