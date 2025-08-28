export default async function sendRequest(url, method = 'GET', payload = null) {
    const options = { method };

    if (payload instanceof FormData) {
        options.body = payload;
    } else if (payload) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
            errBody.message ||
            errBody.error ||
            res.statusText ||
            'Request failed';
        throw new Error(msg);
    }
    
    return res.json();
}