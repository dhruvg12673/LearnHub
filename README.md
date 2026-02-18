# Learnhub.SAKEC

**Learnhub.SAKEC** is an advanced AI-driven Educational Technology platform designed to personlize student learning. It moves beyond static MOOCs by generating dynamic learning paths, "Digital Twin" tutors, and interactive assessments based on user-uploaded content (heutagogy).

## 🚀 Key Features

*   **AI Roadmap Generator:** Creates custom step-by-step learning graphs for any topic, tailored to difficulty and language.
*   **RAG Material Tutor:** Upload PDFs ("DSA Stack.pdf") and the system converts them into a navigable knowledge graph + Chat Interface.
*   **Interview / Viva Mode:** Voice-enabled AI interviewer that asks questions based on your learning history.
*   **Coding Tutor:** Interactive coding environment with AI guidance.
*   **Simulation Hub:** Integration with virtual labs (like PhET) to visualize concepts.
*   **Smart Library:** Recommendation system that suggests resources based on your generated roadmaps.

## 🛠 Tech Stack

### Frontend
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS + Custom CSS
*   **Visualization:** React Flow (Roadmaps), Lucide React (Icons)
*   **State Management:** React Hooks / Context API

### Backend
*   **API:** FastAPI (Python 3.11+)
*   **Orchestration:** LangChain, LangGraph
*   **LLM Inference:** Ollama (Llama 3 8B - Local), Groq (Cloud fallback)
*   **Vector Database:** FAISS (Local flat index)
*   **Database:** SQLite (Local Dev) / Supabase (Production capable)

## ⚙️ Setup & Installation

### Prerequisites
1.  **Python 3.10+** installed.
2.  **Node.js 18+** installed.
3.  **Ollama** installed and running locally.
    ```bash
    ollama pull llama3
    ```

### 1. Backend Setup
Navigate to the `backend` folder:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OLLAMA_BASE_URL=http://localhost:11434
SERPER_API_KEY=your_serper_key_optional
```

Run the server:
```bash
python main.py
# Server runs on http://localhost:8000
```

### 2. Frontend Setup
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
# App runs on http://localhost:5173
```

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/       # AI Logic (planner.py, tutor.py, material_rag.py)
│   │   ├── api/          # FastAPI Routes
│   │   ├── core/         # Config & Prompts
│   │   └── models/       # Pydantic Schemas
│   ├── main.py           # Entry point
│   └── vector_stores/    # FAISS Indices for PDF RAG
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI (TutorChat, RoadmapView)
│   │   ├── pages/        # Main Views (Home, CodingTutor, SimulationHub)
│   │   └── api/          # Axios endpoints
│   └── index.html
```

## 🧠 AI Agents Overview
*   **Planner Agent:** Breaks down high-level topics into DAG (Directed Acyclic Graph) structures.
*   **Material RAG Agent:** Indexes uploaded PDFs chunks them, and performs semantic search during chat.
*   **Tutor Agent:** Handles conversation history and context awareness.

## 🤝 Contribution
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch and open a Pull Request.

---
**Institution:** SAKEC