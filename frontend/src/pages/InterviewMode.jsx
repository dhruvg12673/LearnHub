import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Brain } from 'lucide-react';

const InterviewMode = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { type: 'ai', text: 'Tell me about yourself' }
  ]);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionCount, setQuestionCount] = useState(1);

  const dummyQuestions = [
    'Tell me about yourself',
    'What are your greatest strengths?',
    'Describe a challenging project you worked on',
    'Where do you see yourself in 5 years?',
    'Why are you interested in this field?',
    'How do you handle difficult situations?',
    'What motivates you to learn?',
    'Describe your problem-solving approach',
    'What are your career goals?',
    'How do you stay updated with new technologies?'
  ];

  const handleSubmitAnswer = () => {
    if (userAnswer.trim() === '') return;

    setMessages([...messages, { type: 'user', text: userAnswer }]);
    setUserAnswer('');
  };

  const handleNextQuestion = () => {
    if (questionCount >= dummyQuestions.length) {
      setMessages([...messages, { type: 'ai', text: 'Great job! You have completed all practice questions.' }]);
      return;
    }

    const nextQuestion = dummyQuestions[questionCount];
    setMessages([...messages, { type: 'ai', text: nextQuestion }]);
    setQuestionCount(questionCount + 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
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
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Interview / Viva Practice
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: '0'
          }}>
            Answer questions like a real interview
          </p>
        </div>

        {/* Chat Messages */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          minHeight: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.type === 'ai' ? 'flex-start' : 'flex-end',
                marginBottom: '16px'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.type === 'ai' ? '#f1f5f9' : '#6366f1',
                color: msg.type === 'ai' ? '#1e293b' : 'white',
                fontSize: '15px',
                lineHeight: '1.6'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '12px',
              outline: 'none'
            }}
          />
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              onClick={handleSubmitAnswer}
              disabled={userAnswer.trim() === ''}
              style={{
                flex: '1',
                padding: '12px 24px',
                backgroundColor: userAnswer.trim() === '' ? '#cbd5e1' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: userAnswer.trim() === '' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} />
              Submit Answer
            </button>
            <button
              onClick={handleNextQuestion}
              style={{
                flex: '1',
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
            >
              <Plus size={18} />
              Next Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewMode;