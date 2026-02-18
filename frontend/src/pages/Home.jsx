import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps, generateRoadmap } from '../api/roadmap';
import { Plus, Map, LogOut, Loader2, X, Brain, BookOpen, Clock, TrendingUp, Mic, Library, Newspaper, Code } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Normal');
  const [language, setLanguage] = useState('English');
  const [interest, setInterest] = useState('');
  const [objective, setObjective] = useState('Exam based');
  const [customObjective, setCustomObjective] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const data = await getUserRoadmaps(user.id);
      setRoadmaps(data);
    } catch (error) {
      console.error("Failed to fetch roadmaps", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    let finalObjective = objective;
    if (objective === "Custom") {
        finalObjective = customObjective;
    }
    try {
      const data = await generateRoadmap(topic, difficulty, language, interest, finalObjective, user.id);
      window.location.href = `/roadmap/${data.id}`;
    } catch (error) {
      console.error("Failed to create roadmap", error);
      setGenerating(false);
    }
  };

  const handleRoadmapClick = (id) => {
    window.location.href = `/roadmap/${id}`;
  };

  const calculateProgress = (roadmap) => {
    return Math.floor(Math.random() * 100);
  };

  const countInProgress = () => {
    return roadmaps.filter(r => calculateProgress(r) < 100).length;
  };

  const countCompleted = () => {
    return roadmaps.filter(r => calculateProgress(r) === 100).length;
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="header-logo">
            <div className="logo-icon">
              <Brain className="icon" />
            </div>
            <h1 className="logo-title">LearnHub</h1>
          </div>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.username}</span>
            <button 
              onClick={logout}
              className="logout-button"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <BookOpen size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-value">{roadmaps.length}</p>
                <p className="stat-label">Learning Paths</p>
              </div>
            </div>
            <div 
              className="stat-card" 
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = '/courses/inprogress'}
            >
              <div className="stat-icon stat-icon-green">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-value">In Progress</p>
                <p className="stat-label">Active Learning</p>
              </div>
            </div>
            <div 
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => window.location.href = '/courses/completed'}
            >
              <div className="stat-icon stat-icon-purple">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-value">Completed Courses</p>
                <p className="stat-label">Finished Paths</p>
              </div>
            </div>
          </div>

          <div className="section-header">
            <div>
              <h2 className="section-title">Your Learning Paths</h2>
              <p className="section-subtitle">Personalized roadmaps tailored to your goals</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="create-button"
            >
              <Plus size={20} />
              <span>New Learning Path</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={40} />
              <p className="loading-text">Loading your learning paths...</p>
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <Map size={64} className="empty-icon" />
              </div>
              <h3 className="empty-title">No Learning Paths Yet</h3>
              <p className="empty-description">
                Create your first AI-generated learning roadmap and start your personalized educational journey
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="empty-cta-button"
              >
                <Plus size={20} />
                Create Your First Path
              </button>
            </div>
          ) : (
            <div className="roadmaps-grid">
              {roadmaps.map((roadmap) => {
                const progress = calculateProgress(roadmap);
                return (
                  <div 
                    key={roadmap.id}
                    onClick={() => handleRoadmapClick(roadmap.id)}
                    className="roadmap-card"
                  >
                    <div className="roadmap-header">
                      <div className="roadmap-icon">
                        <BookOpen size={20} />
                      </div>
                      <span className="roadmap-language">{roadmap.language}</span>
                    </div>
                    <h3 className="roadmap-title">{roadmap.topic}</h3>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                          Progress
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>
                          {progress}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: progress === 100 ? '#16a34a' : '#2563eb',
                          transition: 'width 0.3s ease',
                          borderRadius: '9999px'
                        }} />
                      </div>
                    </div>

                    <div className="roadmap-footer">
                      <span className={`difficulty-badge difficulty-${roadmap.difficulty.toLowerCase()}`}>
                        {roadmap.difficulty}
                      </span>
                      <span className="roadmap-date">
                        {new Date(roadmap.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="section-header" style={{ marginTop: '60px' }}>
            <div>
              <h2 className="section-title">Explore Learning Tools</h2>
              <p className="section-subtitle">Enhance your learning experience with AI-powered tools</p>
            </div>
          </div>

          <div className="roadmaps-grid">
            <div 
              onClick={() => window.location.href = '/interview'}
              className="roadmap-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="roadmap-header">
                <div className="roadmap-icon">
                  <Mic size={20} />
                </div>
              </div>
              <h3 className="roadmap-title">Interview / Viva Mode</h3>
              <p className="section-subtitle" style={{ marginTop: '8px', fontSize: '14px' }}>
                Practice interview-style questions with AI
              </p>
            </div>

            <div 
              onClick={() => window.location.href = '/coding-tutor'}
              className="roadmap-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="roadmap-header">
                <div className="roadmap-icon">
                  <Code size={20} />
                </div>
              </div>
              <h3 className="roadmap-title">Coding Tutor</h3>
              <p className="section-subtitle" style={{ marginTop: '8px', fontSize: '14px' }}>
                Interactive coding practice with AI assistance
              </p>
            </div>

            <div 
              onClick={() => window.location.href = '/library'}
              className="roadmap-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="roadmap-header">
                <div className="roadmap-icon">
                  <Library size={20} />
                </div>
              </div>
              <h3 className="roadmap-title">Resources / Library</h3>
              <p className="section-subtitle" style={{ marginTop: '8px', fontSize: '14px' }}>
                Search books, notes, and learning resources
              </p>
            </div>

            <div 
              onClick={() => window.location.href = '/news'}
              className="roadmap-card"
              style={{ cursor: 'pointer' }}
            >
              <div className="roadmap-header">
                <div className="roadmap-icon">
                  <Newspaper size={20} />
                </div>
              </div>
              <h3 className="roadmap-title">Education News</h3>
              <p className="section-subtitle" style={{ marginTop: '8px', fontSize: '14px' }}>
                Latest updates from the education world
              </p>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Create Learning Path</h3>
                <p className="modal-subtitle">AI will generate a personalized roadmap for you</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-field">
                <label className="field-label">
                  Topic
                  <span className="field-required">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Machine Learning, Web Development, Data Science"
                  className="field-input"
                  required
                />
                <p className="field-hint">Enter the subject you want to learn</p>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="field-select"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="field-label">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="field-select"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Normal">Normal</option>
                    <option value="Difficult">Difficult</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Objective</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="field-select"
                  >
                    <option value="Exam based">Exam based</option>
                    <option value="Conceptual">Conceptual</option>
                    <option value="Skill based">Skill based</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {objective === 'Custom' && (
                  <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Custom Goal</label>
                    <input
                      type="text"
                      value={customObjective}
                      onChange={(e) => setCustomObjective(e.target.value)}
                      maxLength={100}
                      placeholder="Enter your specific goal (max 100 chars)"
                      className="field-input"
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textAlign: 'right' }}>
                      {customObjective.length}/100
                    </div>
                  </div>
                )}

                <div className="form-field">
                  <label className="field-label">Interest (Optional)</label>
                  <input
                    type="text"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="e.g. Anime, Football"
                    className="field-input"
                  />
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={generating}
                className="modal-submit-button"
              >
                {generating ? (
                  <>
                    <Loader2 className="button-spinner" size={20} />
                    <span>Generating Your Path...</span>
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;