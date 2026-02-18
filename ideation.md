# Project Ideation: Personalized Adaptive Learning LLM

## 1. Project Overview
**Goal:** Build an award-winning hackathon project that provides a personalized learning path.
**Core Loop:** User Selects Topic -> Initial Roadmap (Easy/Med/Hard) -> Content Consumption (Modes) -> Quiz -> Adaptive Adjustment -> Feedback.

## 2. Proposed Architecture (Refined)
*   **Frontend:** React (Vite) + Tailwind CSS.
    *   **Visualization:** `react-flow-renderer` for the dynamic roadmap.
    *   **State:** React Context/Zustand.
    *   **Live Chat:** Floating widget powered by **Gemini API**.
*   **Backend:** Python (FastAPI).
    *   **Orchestration:** **LangGraph** (StateGraph) to manage the cyclic multi-agent flow.
    *   **Inference:** **Ollama** (Local - Llama 3 / Mistral) for all core agents.
*   **Database:** **Supabase** (PostgreSQL).
    *   Tables: `users`, `roadmaps`, `nodes`, `progress`, `quiz_results`.
*   **Search & Retrieval:**
    *   **Vector Store:** FAISS (Local) for syllabus PDF RAG.
    *   **Web Search:** **Serper API** (Images & YouTube Videos).

## 3. Multi-Agent Flow (The "Three-Agent" Core)
*Based on instructions.md, grouped into logical units:*

1.  **Interface Agent (The Executor):**
    *   **Role:** Plans the roadmap, generates content, and creates quizzes.
    *   **Inputs:** User data, RAG data, and Digital Twin guidance.
    *   **Logic:** Generates content based on the *User-Selected Mode* (Story, Deep, Exam).

2.  **RAG Agent (The Librarian):**
    *   **Role:** Information retrieval.
    *   **Actions:**
        *   Checks RAG database (Syllabus PDF).
        *   **Function Calling:** Fetches YouTube links and Images via **Serper API**.
    *   **Output:** Raw context and media assets for the Interface Agent.

3.  **Student Digital Twin Agent (The Manager):**
    *   **Role:** Tracks user state and performance.
    *   **Actions:**
        *   Monitors user choices and quiz performance in Supabase.
        *   Generates detailed **Review Reports** (Feedback).
        *   **Adaptation:** Tells the Interface Agent what *Difficulty Level* (not Mode) to use for the next generation (e.g., simplify if failing, deepen if excelling).

## 4. Feature Deep Dive

### A. The Roadmap Generator
*   **Input:** Topic + Difficulty.
*   **Process:** LLM generates a JSON structure representing a dependency tree of subtopics.
*   **Storage:** Saved to Postgres.

### B. Content Modes (The "Secret Sauce")
We need distinct System Prompts for each mode:
*   **Story Mode:** "You are a creative writer explaining complex concepts using analogies, characters, and plot..."
*   **Deep Knowledge:** "You are a research scientist. Provide rigorous definitions, mathematical proofs, and edge cases..."
*   **Exam/Interview:** "You are a senior interviewer. List top 10 frequently asked questions, quick cheat-sheets, and common pitfalls..."

### C. The Adaptive Feedback Loop
*   **Trigger:** Quiz Completion.
*   **Inputs:** Score (e.g., 60%), Time per question (e.g., 10s vs 60s).
*   **Logic:**
    *   *High Score + Fast Time:* Mark topic "Mastered". Unlock next node. Maybe suggest "Deep Knowledge" for next topic.
    *   *Low Score:* Trigger "Remediation".
        *   **Action:** The LLM takes the current subtopic and breaks it down into 3 smaller, simpler sub-nodes. The roadmap *expands* dynamically.

### D. Multimedia
*   **Images:** "Concept IDs" approach is great for precision but hard to scale for a hackathon.
    *   *Suggestion:* Use a hybrid. Check local DB for a high-quality diagram. If missing, use the Unsplash API or generate a prompt for an image generation model (if available), or just fallback to text.
*   **YouTube:** Search YouTube API with query `"{subtopic} explanation {difficulty}"`.

## 4. Clarifying Questions (Doubts)

1.  **Ollama Hosting:** Will Ollama be running on the same machine as the backend? (Latency is key for "Live" feeling).
2.  **Image Database:** For the hackathon, do you have a dataset of images ready, or should we mock this with a few examples and use an API for the rest?
3.  **Quiz Format:** Are quizzes Multiple Choice (easier to grade automatically) or Subjective (requires LLM to grade)?
4.  **Gemini Integration:** You mentioned Gemini for the Live Bot. Do you have an API key for Gemini, or should we route that through Ollama as well to keep it all local?

## 5. Suggestions for "Award Winning" Factor
1.  **Visual Roadmap:** Use a library like `reactflow` to visualize the learning path dynamically changing (nodes appearing) when the user fails/succeeds. Visualizing the "Adaptation" is very powerful for demos.
2.  **Voice Mode:** If time permits, adding Text-to-Speech for the "Story Mode" adds a lot of immersion.
3.  **Gamification:** Simple streaks or XP based on "Deep Knowledge" vs "Exam Mode" usage.

## 6. Next Steps
1.  Confirm Tech Stack (FastAPI vs Flask).
2.  Design Database Schema.
3.  Setup Basic Frontend/Backend Repo structure.
