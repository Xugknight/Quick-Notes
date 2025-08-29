import sendRequest from './sendRequest';
const BASE_URL = '/api/notes';

export function index({ currentPage = 1, itemsPerPage = 6, searchQuery = '' } = {}) {
    const params = new URLSearchParams({ page: currentPage, limit: itemsPerPage });
    if (searchQuery) params.set('q', searchQuery);
    return sendRequest(`${BASE_URL}?${params.toString()}`);
}
export function create(noteData) { return sendRequest(BASE_URL, 'POST', noteData); }
export function update(noteId, updateData) { return sendRequest(`${BASE_URL}/${noteId}`, 'PUT', updateData); }
export function remove(noteId) { return sendRequest(`${BASE_URL}/${noteId}`, 'DELETE'); }
export function show(noteId) { return sendRequest(`${BASE_URL}/${noteId}`); }
export function pin(noteId, shouldPin) { return sendRequest(`${BASE_URL}/${noteId}/pin`, 'PATCH', { pinned: shouldPin }); }
export function reorder(noteIds) { return sendRequest(`${BASE_URL}/reorder`, 'PATCH', { noteIds }); }
export function reorderPair(draggedId, overId) { return sendRequest('/api/notes/reorder-pair', 'POST', { draggedId, overId }); }