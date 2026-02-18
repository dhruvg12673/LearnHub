import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const generateRoadmap = async (topic, difficulty, language = "English", interest = "", objective = "", userId) => {
  try {
    const response = await axios.post(`${API_URL}/roadmap/generate`, {
      topic,
      difficulty,
      language,
      interest: interest || null,
      objective: objective || null,
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw error;
  }
};

export const getUserRoadmaps = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/roadmap/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user roadmaps:", error);
    throw error;
  }
};

export const getRoadmap = async (roadmapId) => {
  try {
    const response = await axios.get(`${API_URL}/roadmap/${roadmapId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    throw error;
  }
};
export const updateRoadmap = async (id, nodes, edges) => {
  try {
    const response = await axios.put(`${API_URL}/roadmap/${id}/update`, {
      nodes,
      edges
    });
    return response.data;
  } catch (error) {
    console.error("Error updating roadmap:", error);
    throw error;
  }
};
