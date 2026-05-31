import { BASE_URL, handleResponse } from "./config.js";

export async function getActivity() {
    const res = await fetch(`${BASE_URL}/activities`);
    return handleResponse(res);
}

export default { getActivity };