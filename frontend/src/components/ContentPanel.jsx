import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  BookOpen, 
  Brain, 
  GraduationCap, 
  Loader2, 
  Trophy, 
  Volume2, 
  Square,
  X,
  Youtube
} from 'lucide-react';
import QuizModal from './QuizModal';
import './ContentPanel.css';

const ContentPanel = ({ data, topic, subtopic, onModeChange, loading, currentMode, difficulty, language, roadmapId, interest }) => {
  useEffect(() => {
    console.log("ContentPanel received interest:", interest);
  }, [interest]);

  const [showQuiz, setShowQuiz] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enlargedImg, setEnlargedImg] = useState(null); // State for light-box

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [subtopic]);

  const speakContent = () => {
    if (!data?.content) return;
    window.speechSynthesis.cancel();
    const text = data.content.replace(/[#_*`>-]/g, '').replace(/\n+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    setTimeout(() => { window.speechSynthesis.speak(utterance); }, 250);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!subtopic) {
    return (
      <div className="content-panel-empty">
        <div className="empty-icon-container">
          <BookOpen size={64} className="empty-icon" />
        </div>
        <h3 className="empty-title">Select a Topic to Begin</h3>
        <p className="empty-description">Click on any node from the learning path to explore detailed content</p>
      </div>
    );
  }

  return (
    <div className="content-panel-container">
      {/* IMAGE LIGHTBOX OVERLAY */}
      {enlargedImg && (
        <div className="image-lightbox" onClick={() => setEnlargedImg(null)}>
          <button className="close-lightbox"><X size={32} /></button>
          <img src={enlargedImg} alt="Enlarged view" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="content-panel-header">
        <div className="flex justify-between items-start w-full">
          <div>
            <h2 className="content-title">{subtopic}</h2>
            <p className="content-subtitle">{topic}</p>
          </div>
          
          {data && !loading && (
            <button
              onClick={isSpeaking ? stopSpeaking : speakContent}
              className={`tts-toggle ${isSpeaking ? 'speaking' : ''}`}
              title={isSpeaking ? "Stop Reading" : "Read Aloud"}
            >
              {isSpeaking ? <Square size={18} /> : <Volume2 size={18} />}
              <span>{isSpeaking ? "Stop" : "Read"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="mode-selector">
        <button onClick={() => onModeChange('story')} className={`mode-button ${currentMode === 'story' ? 'mode-button-active mode-button-story' : 'mode-button-inactive'}`}>
          <BookOpen size={16} /> <span>{interest ? 'Interest Mode' : 'Story Mode'}</span>
        </button>
        <button onClick={() => onModeChange('deep')} className={`mode-button ${currentMode === 'deep' ? 'mode-button-active mode-button-deep' : 'mode-button-inactive'}`}>
          <Brain size={16} /> <span>Deep Dive</span>
        </button>
        <button onClick={() => onModeChange('exam')} className={`mode-button ${currentMode === 'exam' ? 'mode-button-active mode-button-exam' : 'mode-button-inactive'}`}>
          <GraduationCap size={16} /> <span>Exam Prep</span>
        </button>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="content-loading">
            <Loader2 size={48} className="loading-spinner-large" />
            <p className="loading-message">Generating personalized content...</p>
          </div>
        ) : data ? (
          <div className="content-body">
            
            {/* 3-COLUMN IMAGE GRID */}
            {data.images?.length > 0 && (
              <div className="image-grid-3-col">
                {data.images.map((img, i) => (
                  <div key={i} className="grid-image-wrapper" onClick={() => setEnlargedImg(img)}>
                    <img src={img} alt={`Visual aid ${i+1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* VIDEO LINKS */}
            {data.videos?.length > 0 && (
              <div className="video-grid">
                {data.videos.map((v, i) => {
                  const link = typeof v === 'string' ? v : v.link;
                  const title = typeof v === 'string' ? `Tutorial ${i+1}` : v.title;
                  
                  return (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="video-card">
                      <Youtube size={20} className="text-red-600" fill="currentColor" />
                      <span className="video-title truncate">{title}</span>
                    </a>
                  );
                })}
              </div>
            )}

            <div className="markdown-content">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>

      {data && !loading && (
        <div className="quiz-button-container">
          <button onClick={() => setShowQuiz(true)} className="quiz-button">
            <Trophy size={20} />
            <span>Test Your Knowledge</span>
          </button>
        </div>
      )}

      <QuizModal 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)}
        topic={topic}
        subtopic={subtopic}
        difficulty={difficulty}
        language={language}
        roadmapId={roadmapId}
      />
    </div>
  );
};

export default ContentPanel;