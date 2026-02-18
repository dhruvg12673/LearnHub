// frontend/src/api/coding.js
const API_URL = 'http://localhost:8000/api/coding';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const codingApi = {
    // Start a new session
    startSession: async (userId, language, topic = "General Practice") => {
        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ user_id: userId, language, topic })
        });
        if (!response.ok) throw new Error('Failed to start session');
        return response.json();
    },

    // Get session details and history
    getSession: async (sessionId) => {
        const response = await fetch(`${API_URL}/session/${sessionId}`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        if (!response.ok) throw new Error('Failed to fetch session');
        return response.json();
    },

    // Analyze code
    analyzeCode: async (code, language, context = "") => {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ code, language, problem_statement: context })
        });
        if (!response.ok) throw new Error('Failed to analyze code');
        return response.json();
    },

    // Get all user sessions
    getUserSessions: async (userId) => {
        const response = await fetch(`${API_URL}/sessions/${userId}`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    }
    
    // Note: The chat endpoint is a streaming endpoint, so it will be handled differently 
    // in the component using the native fetch API or axios with onDownloadProgress, 
    // but typically fetch is easier for streams.
};
