import sendRequest from './sendRequest';
const BASE_URL = '/api/notes';


export function index() { return sendRequest(BASE_URL); }
export function create(data) { return sendRequest(BASE_URL, 'POST', data); }
export function update(id, data) { return sendRequest(`${BASE_URL}/${id}`, 'PUT', data); }
export function remove(id) { return sendRequest(`${BASE_URL}/${id}`, 'DELETE'); }
export function show(id) { return sendRequest(`${BASE_URL}/${id}`); }