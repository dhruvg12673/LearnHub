import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, CheckCircle, XCircle, ArrowRight, Loader2, Trophy, Award, TrendingUp, Bot, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateQuiz, submitQuiz } from '../api/quiz';
import { useAuth } from '../context/AuthContext';
import './QuizModal.css';

const QuizModal = ({ isOpen, onClose, topic, subtopic, difficulty, language, roadmapId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeTaken, setTimeTaken] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadQuiz();
    } else {
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeTaken({});
      setResult(null);
      setShowReview(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (questions.length > 0 && !result) {
      setStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions, result]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const data = await generateQuiz(topic, subtopic, difficulty, language, roadmapId);
      setQuestions(data.questions);
    } catch (error) {
      console.error("Failed to load quiz", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (result) return;
    const currentQ = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
  };

  const handleNext = () => {
    const currentQ = questions[currentQuestionIndex];
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    setTimeTaken(prev => ({ ...prev, [currentQ.id]: elapsed }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit(elapsed);
    }
  };

  const handleSubmit = async (lastQuestionTime) => {
    setSubmitting(true);
    
    const currentQ = questions[currentQuestionIndex];
    const finalTimeTaken = { ...timeTaken, [currentQ.id]: lastQuestionTime };
    const totalTime = Object.values(finalTimeTaken).reduce((a, b) => a + b, 0);

    try {
      const data = await submitQuiz(
        user.id,
        roadmapId,
        subtopic,
        topic,
        questions,
        answers,
        finalTimeTaken,
        totalTime
      );
      setResult(data);
    } catch (error) {
      console.error("Failed to submit quiz", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal-container">
        
        {/* Header */}
        <div className="quiz-modal-header">
          <div className="header-content">
            <h3 className="header-title">Quiz: {subtopic}</h3>
            <p className="header-subtitle">Test your understanding</p>
          </div>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="quiz-modal-body">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="loading-spinner-large" />
              <p className="loading-text">Generating personalized questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="error-state">
              <div className="error-icon-wrapper">
                <XCircle className="error-icon" />
              </div>
              <h4 className="error-title">Unable to Load Quiz</h4>
              <p className="error-message">Please try again in a moment.</p>
              <button 
                onClick={loadQuiz}
                className="retry-button"
              >
                Retry
              </button>
            </div>
          ) : result ? (
            showReview ? (
              // Review View
              <div className="review-view">
                <div className="review-header">
                  <div className="review-icon-wrapper">
                    <Bot className="review-icon" />
                  </div>
                  <h3 className="review-title">AI Performance Review</h3>
                </div>
                <div className="review-content">
                  <ReactMarkdown>{result.review}</ReactMarkdown>
                </div>
                <button 
                  onClick={() => setShowReview(false)}
                  className="back-to-result-button"
                >
                  <ArrowLeft size={16} />
                  Back to Score
                </button>
              </div>
            ) : (
            // Result View
            <div className="result-view">
              <div className="result-icon-wrapper">
                <Trophy className="result-icon" />
              </div>
              <h2 className="result-score">Score: {result.score}%</h2>
              <p className="result-summary">
                You answered {result.correct_count} out of {result.total_questions} questions correctly
              </p>
              
              <div className="mastery-card">
                <div className="mastery-header">
                  <Award size={20} className="mastery-icon" />
                  <h4 className="mastery-title">Knowledge Assessment</h4>
                </div>
                <div className="mastery-stats">
                  <div className="mastery-stat">
                    <span className="stat-label">Mastery Score</span>
                    <span className="stat-value stat-value-mastery">{result.knowledge_update.mastery}%</span>
                  </div>
                  <div className="mastery-stat">
                    <span className="stat-label">Status</span>
                    <span className={`stat-value stat-value-status status-${result.knowledge_update.status}`}>
                      {result.knowledge_update.status}
                    </span>
                  </div>
                </div>
                
                <div className="progress-indicator">
                  <TrendingUp size={16} className="progress-icon" />
                  <span className="progress-text">Your learning path has been updated</span>
                </div>
              </div>

              <div className="result-actions">
                <button 
                  onClick={() => setShowReview(true)}
                  className="see-review-button"
                >
                  <Bot size={18} />
                  See AI Review
                </button>
                <button 
                  onClick={onClose}
                  className="result-close-button"
                >
                  Continue Learning
                </button>
              </div>
            </div>
            )
          ) : (
            // Question View
            <div className="question-view">
              {/* Progress Bar */}
              <div className="progress-bar-wrapper">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="question-info">
                <span className="question-counter">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <div className="timer-badge">
                  <Clock size={14} />
                  <span>Timer active</span>
                </div>
              </div>

              <h3 className="question-text">
                {questions[currentQuestionIndex]?.question}
              </h3>

              <div className="options-list">
                {questions[currentQuestionIndex]?.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    className={`option-button ${answers[questions[currentQuestionIndex].id] === option ? 'option-button-selected' : ''}`}
                  >
                    <span className="option-text">{option}</span>
                    {answers[questions[currentQuestionIndex].id] === option && (
                      <CheckCircle size={20} className="option-check-icon" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !result && questions.length > 0 && (
          <div className="quiz-modal-footer">
            <button
              onClick={handleNext}
              disabled={!answers[questions[currentQuestionIndex].id] || submitting}
              className="next-button"
            >
              {submitting ? (
                <>
                  <Loader2 className="button-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;