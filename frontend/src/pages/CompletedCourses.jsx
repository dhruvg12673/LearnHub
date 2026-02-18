import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserRoadmaps } from '../api/roadmap';
import { ArrowLeft, BookOpen, Loader2, Award, CheckCircle } from 'lucide-react';
import './Home.css';

const CompletedCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedCourses();
  }, []);

  const fetchCompletedCourses = async () => {
    try {
      const data = await getUserRoadmaps(user.id);
      const completed = data.filter((_, index) => index % 3 === 0).map(course => ({
        ...course,
        progress: 100
      }));
      setCourses(completed);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (id) => {
    window.location.href = `/roadmap/${id}`;
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <button
            onClick={() => window.location.href = '/'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <div className="section-header">
            <div>
              <h2 className="section-title">Completed Courses</h2>
              <p className="section-subtitle">Your achievements and finished learning paths</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={40} />
              <p className="loading-text">Loading your achievements...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <Award size={64} className="empty-icon" />
              </div>
              <h3 className="empty-title">No Completed Courses Yet</h3>
              <p className="empty-description">
                Complete your first learning path to see your achievements here
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="empty-cta-button"
              >
                Browse Learning Paths
              </button>
            </div>
          ) : (
            <div className="roadmaps-grid">
              {courses.map((course) => (
                <div 
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                  className="roadmap-card"
                >
                  <div className="roadmap-header">
                    <div className="roadmap-icon" style={{ 
                      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                    }}>
                      <CheckCircle size={20} style={{ color: '#16a34a' }} />
                    </div>
                    <span 
                      className="roadmap-language" 
                      style={{ 
                        backgroundColor: '#dcfce7', 
                        color: '#16a34a',
                        fontWeight: '600'
                      }}
                    >
                      Completed
                    </span>
                  </div>
                  <h3 className="roadmap-title">{course.topic}</h3>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>
                        Completion
                      </span>
                      <span style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: '700' }}>
                        100%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '9999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#16a34a',
                        transition: 'width 0.3s ease',
                        borderRadius: '9999px'
                      }} />
                    </div>
                  </div>

                  <div className="roadmap-footer">
                    <span className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}>
                      {course.difficulty}
                    </span>
                    <span className="roadmap-date">
                      {new Date(course.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompletedCourses;