import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const generateContent = async (topic, subtopic, mode = "story", difficulty = "Normal", language = "English", images = null, videos = null, roadmapId = null, interest = null) => {
  try {
    const response = await axios.post(`${API_URL}/content/generate`, {
      topic,
      subtopic,
      mode,
      difficulty,
      language,
      images,
      videos,
      interest,
      roadmap_id: roadmapId
    });
    return response.data;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};
