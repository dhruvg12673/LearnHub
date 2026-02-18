import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Send, X, MessageSquare, Loader2, Minimize2 } from 'lucide-react';
import { tutorApi } from '../api/tutor';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import './TutorChat.css';

const TutorChat = ({ topic }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (isOpen && user && topic) {
            loadHistory();
            setHasUnread(false);
        }
    }, [isOpen, user, topic]);

    // Initial load even if closed to check if clean start
    useEffect(() => {
        if (user && topic) {
             // Optimistic reset just to be safe
        }
    }, [topic]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const loadHistory = async () => {
        try {
            const history = await tutorApi.getHistory(user.id, topic);
            setMessages(history);
            if (history.length === 0) {
                // Welcome message
                setMessages([{ 
                    role: 'assistant', 
                    content: `Hello! I'm your professor for **${topic}**. Ask me anything about this topic!` 
                }]);
            }
        } catch (error) {
            console.error("Failed to load tutor history", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userMsg = inputValue;
        setInputValue('');
        
        // Optimistic UI
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const data = await tutorApi.chat(user.id, topic, userMsg);
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tutor-chat-container">
            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    className={`tutor-toggle-btn ${hasUnread ? 'has-unread' : ''}`}
                    onClick={() => setIsOpen(true)}
                    title="Open Learning Tutor"
                >
                    <div className="tutor-icon-wrapper">
                        <GraduationCap size={24} color="white" />
                    </div>
                    <span className="tutor-label">AI Tutor</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="tutor-window">
                    <div className="tutor-header">
                        <div className="tutor-header-left">
                            <div className="tutor-header-icon">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <h3 className="tutor-title">Professor {topic}</h3>
                                <span className="tutor-subtitle">Always here to help</span>
                            </div>
                        </div>
                        <button className="tutor-close-btn" onClick={() => setIsOpen(false)}>
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    <div className="tutor-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
                                <div className="message-content">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message assistant-message">
                                <div className="message-content loading-dots">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="tutor-input-area">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`Ask about ${topic}...`}
                            className="tutor-input"
                            autoFocus
                        />
                        <button type="submit" disabled={!inputValue.trim() || loading} className="tutor-send-btn">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TutorChat;
