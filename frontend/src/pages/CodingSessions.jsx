import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { codingApi } from '../api/coding';
import { Plus, X, Code, Terminal, Clock, MessageSquare, Brain, LogOut, ArrowLeft } from 'lucide-react';
import './CodingSessions.css';
import '../pages/Home.css'; // Reuse some modal styles

const CodingSessions = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('Python');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        try {
            const data = await codingApi.getUserSessions(user.id);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        
        setCreating(true);
        try {
            const result = await codingApi.startSession(user.id, language, topic);
            navigate(`/coding-session/${result.session_id}`);
        } catch (error) {
            console.error("Failed to create session:", error);
            setCreating(false);
        }
    };

    const handleSessionClick = (sessionId) => {
        navigate(`/coding-session/${sessionId}`);
    };

    return (
        <div className="home-container">
            {/* Navbar (Same as Home.jsx) */}
            <header className="home-header">
                <div className="header-content">
                    <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
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
                    <div className="section-header">
                        <div>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                background: 'none',
                                border: 'none',
                                color: '#6366f1',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                marginBottom: '16px',
                                padding: '0'
                                }}
                            >
                                <ArrowLeft size={18} />
                                Back to Home
                            </button>
                            <h2 className="section-title">Your Coding Sessions</h2>
                            <p className="section-subtitle">Continue your practice or start a new challenge.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="empty-state-container bg-white rounded-lg border border-gray-200 p-12 text-center">
                            <div className="flex justify-center mb-4 text-gray-400">
                                <Terminal size={48} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sessions Yet</h3>
                            <p className="text-gray-500 mb-6">Start a new coding session to practice your skills with AI assistance.</p>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus size={20} />
                                Start First Session
                            </button>
                        </div>
                    ) : (
                        <div className="roadmaps-grid">
                            {sessions.map((session) => (
                                <div 
                                    key={session.id} 
                                    className="roadmap-card"
                                    onClick={() => handleSessionClick(session.id)}
                                >
                                    <div className="roadmap-header">
                                        <div className="roadmap-icon" style={{ background: '#eff6ff' }}> {/* Light blue bg */}
                                            <Code size={20} className="text-blue-600" />
                                        </div>
                                        <span className="roadmap-language">{session.language}</span>
                                    </div>
                                    <h3 className="roadmap-title">
                                        {session.title || `${session.language} Practice`}
                                    </h3>
                                    
                                    <div className="roadmap-footer mt-4">
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Clock size={14} className="mr-1.5" />
                                            <span>
                                                {new Date(session.created_at).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <MessageSquare size={14} className="mr-1.5" />
                                            <span>Open Chat</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fab-container">
                <button 
                    className="fab-button"
                    onClick={() => setShowModal(true)}
                    title="New Session"
                >
                    <Plus size={32} />
                </button>
            </div>

            {/* Create Session Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">New Coding Session</h3>
                                <p className="modal-subtitle">Setup your environment</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="modal-form">
                            <div className="form-field">
                                <label className="field-label">Topic / Goal <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Binary Search, React Hooks, Python Basics"
                                    className="field-input"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-field">
                                <label className="field-label">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="field-select"
                                >
                                    <option value="Python">Python</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="Go">Go</option>
                                    <option value="Rust">Rust</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={creating || !topic.trim()}
                                className="modal-submit-button w-full mt-4"
                            >
                                {creating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Terminal size={18} className="mr-2" />
                                        <span>Start Coding</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodingSessions;
