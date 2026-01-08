import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const generateQuiz = async (topic, subtopic, difficulty, language, roadmapId) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/generate`, {
      topic,
      subtopic,
      difficulty,
      language,
      roadmap_id: roadmapId
    });
    return response.data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const submitQuiz = async (userId, roadmapId, nodeLabel, topic, questions, answers, timeTaken, totalTime) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/submit`, {
      user_id: userId,
      roadmap_id: roadmapId,
      node_label: nodeLabel,
      topic,
      questions,
      answers,
      time_taken: timeTaken,
      total_time: totalTime
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting quiz:", error);
    throw error;
  }
};
