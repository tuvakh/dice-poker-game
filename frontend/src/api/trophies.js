import { BASE_URL, getAuthHeaders, handleResponse } from "./config.js";

export async function getAllTrophies() {
    const res = await fetch(`${BASE_URL}/trophies`);
    return handleResponse(res);
}

// Sends a multipart form request to create a trophy with a title and image file
export async function createTrophy({ title, image }) {
    const form = new FormData();
    form.append("title", title);
    form.append("image", image);
    const res = await fetch(`${BASE_URL}/trophies`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form
    });
    return handleResponse(res);
}
