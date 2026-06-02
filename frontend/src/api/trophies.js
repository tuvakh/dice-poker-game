import { BASE_URL, fetchWithAuth, handleResponse } from "./config.js";

// Sends a multipart form request to create a trophy with a title and image file
export async function createTrophy({ title, image }) {
    const form = new FormData();
    form.append("title", title);
    form.append("image", image);
    const res = await fetchWithAuth(`${BASE_URL}/trophies`, {
        method: "POST",
        body: form
    });
    return handleResponse(res);
}
