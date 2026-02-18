import React, { useState, useEffect, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { codingApi } from '../api/coding';
import './CodingTutor.css';
import '../pages/Home.css'; // Import Home CSS for header styles
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LogOut, ArrowLeft, Send } from 'lucide-react';

const CodingTutor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [code, setCode] = useState("// Write your code here...");
  const [language, setLanguage] = useState("python");
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);

  
  // Initialize session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        if (!user || !id) return;
        
        const data = await codingApi.getSession(id);
        setSession(data.session);
        setLanguage(data.session.language.toLowerCase()); // Set editor language
        
        // Load messages if any, else set default
        if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
        } else {
             setMessages([{
                role: 'assistant',
                content: `Hello! I'm your AI Coding Tutor. We are using ${data.session.language}. I see we are working on "${data.session.title}". How can I help you?`
             }]);
        }

      } catch (error) {
        console.error("Failed to load session:", error);
        // navigate('/coding-tutor'); // Redirect back if fails
      }
    };

    loadSession();
  }, [id, user]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !session) return;

    const userMsg = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Prepare for streaming response
      const response = await fetch('http://localhost:8000/api/coding/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          session_id: session.id,
          message: userMsg.content,
          current_code: code // Optional context
        })
      });

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let aiMsgContent = "";
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // The chunk might contain multiple "data: " lines or partial lines.
        // Our backend sends raw text chunks, not SSE format, based on the implementation provided earlier.
        // Wait, looking at routes/coding.py: "yield chunk" directly from chain.stream.
        // So it's just raw text streaming.
        
        aiMsgContent += chunk;
        
        // Update the last message (the AI's message) with the accumulated content
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'assistant', content: aiMsgContent };
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyzeCode = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    try {
        const result = await codingApi.analyzeCode(code, language, "Please review this code for errors and best practices.");
        
        const analysisMsg = `**Code Analysis**:\n\n${result.feedback}`;
        setMessages(prev => [...prev, { role: 'assistant', content: analysisMsg }]);
        
    } catch (error) {
        console.error("Analysis failed:", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="coding-tutor-container">
      {/* Navbar - Consistent with Home */}
      <header className="home-header">
        <div className="header-content">
          <div className="header-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Brain className="icon" />
            </div>
            <h1 className="logo-title">LearnHub</h1>
          </div>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user?.username}</span>
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
      
      <div className="tutor-main">
        <div className="tutor-subheader">
             <div className="flex flex-col gap-2">
                 <button
                    onClick={() => navigate('/coding-tutor')}
                    style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    width: 'fit-content',
                    padding: '0'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Sessions
                </button>
                 <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {session ? session.title : 'Details'}
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
                        {language}
                    </span>
                 </div>
             </div>
        </div>

        <div className="split-view">
            {/* Chat Panel */}
            <div className="chat-panel">
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    {/* Simple whitespace preservation for now. Markdown rendering would be better. */}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                </div>
                ))}
                {isTyping && <div className="message ai">Thinking...</div>}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="chat-input-area">
                <div className="flex gap-2 relative">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask for a hint or problem..."
                        className="chat-input"
                    />
                    <button 
                        type="submit" 
                        disabled={isTyping || !inputMessage.trim()}
                        className="absolute right-2 top-1.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
            </div>

            {/* Editor Panel */}
            <div className="editor-panel">
            <div className="editor-toolbar">
                <span className="text-sm font-medium">main.{language === 'python' ? 'py' : 'js'}</span>
                <div className="ml-auto">
                    <button 
                        onClick={handleAnalyzeCode}
                        disabled={isAnalyzing}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        {isAnalyzing ? (
                             <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Analyzing...
                             </>
                        ) : 'Analyze Code'}
                    </button>
                </div>
            </div>
            <div className="code-editor-wrapper">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={code}
                    theme="vs-dark" // Keep editor dark for contrast, or change to "light" if strictly required
                    onChange={(value) => setCode(value)}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 16 }
                    }}
                />
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTutor;
