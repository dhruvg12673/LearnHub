const API_URL = 'http://localhost:8000/api/resources';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const resourcesApi = {
    // Get recommendations for a user
    getRecommendations: async (userId) => {
        const headers = getAuthHeaders();
        // If query param approach is preferred:
        const response = await fetch(`${API_URL}/recommendations?user_id=${userId}`, {
            headers: headers
        });
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        return response.json();
    },

    // Get all resources
    getAll: async () => {
        const response = await fetch(`${API_URL}/`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to fetch resources');
        return response.json();
    },

    // Upload a new resource
    upload: async (formData) => {
        // Note: Do NOT set Content-Type header for FormData, 
        // the browser sets it automatically with the boundary
        const headers = getAuthHeaders();
        
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: headers, 
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload resource');
        return response.json();
    },

    // Download a resource
    download: async (id, filename) => {
        const response = await fetch(`${API_URL}/download/${id}`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to download resource');
        
        // Trigger download in browser
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    // Delete a resource
    delete: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to delete resource');
        return response.json();
    }
};
