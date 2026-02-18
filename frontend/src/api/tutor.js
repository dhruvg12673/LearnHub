const API_URL = 'http://localhost:8000/api/tutor';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const tutorApi = {
    getHistory: async (userId, topic) => {
        const response = await fetch(`${API_URL}/history?user_id=${userId}&topic=${encodeURIComponent(topic)}`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to fetch tutor history');
        return response.json();
    },

    chat: async (userId, topic, message) => {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders() 
            },
            body: JSON.stringify({ user_id: userId, topic, message })
        });
        if (!response.ok) throw new Error('Failed to send message to tutor');
        return response.json();
    }
};
