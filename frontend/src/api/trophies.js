import { BASE_URL, fetchWithAuth, handleResponse } from "./config.js";

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
