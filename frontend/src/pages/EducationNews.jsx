import React from 'react';
import { ArrowLeft, Calendar, Tag, TrendingUp } from 'lucide-react';

const EducationNews = ({ onNavigate }) => {
  const newsData = [
    {
      id: 1,
      headline: 'New AI-Powered Learning Platform Launches for Students',
      summary: 'A revolutionary AI-based educational platform has been launched to help students create personalized learning paths and track their progress in real-time.',
      date: '2024-01-15',
      category: 'AI'
    },
    {
      id: 2,
      headline: 'Government Announces Scholarship Program for STEM Students',
      summary: 'The Ministry of Education has announced a new scholarship program worth $50 million to support students pursuing Science, Technology, Engineering, and Mathematics degrees.',
      date: '2024-01-12',
      category: 'Government'
    },
    {
      id: 3,
      headline: 'Universities Adopt Hybrid Learning Models Post-Pandemic',
      summary: 'Leading universities worldwide are implementing permanent hybrid learning models, combining in-person and online education to provide flexible learning options.',
      date: '2024-01-10',
      category: 'University'
    },
    {
      id: 4,
      headline: 'National Board Exams Rescheduled Due to Weather Conditions',
      summary: 'The National Board has announced rescheduling of semester exams in affected regions following severe weather disruptions across multiple states.',
      date: '2024-01-08',
      category: 'Exam'
    },
    {
      id: 5,
      headline: 'Virtual Reality Integration in Medical Education Shows Promising Results',
      summary: 'Medical schools report significant improvements in student performance after integrating VR technology for surgical training and anatomy lessons.',
      date: '2024-01-05',
      category: 'AI'
    },
    {
      id: 6,
      headline: 'New Policy for Recognition of Online Degrees Announced',
      summary: 'Government releases comprehensive framework for recognition and equivalence of online degrees from accredited institutions, boosting distance learning credibility.',
      date: '2024-01-03',
      category: 'Government'
    },
    {
      id: 7,
      headline: 'Top Universities Launch Joint Research Initiative on Climate Change',
      summary: 'Leading global universities collaborate on a $100M research initiative to address climate change through innovative educational programs and research.',
      date: '2023-12-28',
      category: 'University'
    },
    {
      id: 8,
      headline: 'Competitive Exam Pattern Changes Announced for 2024',
      summary: 'Major changes in examination patterns for entrance tests have been announced, including modifications to question types and assessment criteria.',
      date: '2023-12-25',
      category: 'Exam'
    }
  ];

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Exam':
        return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
      case 'Government':
        return { bg: '#dbeafe', text: '#1e3a8a', border: '#3b82f6' };
      case 'AI':
        return { bg: '#ede9fe', text: '#5b21b6', border: '#8b5cf6' };
      case 'University':
        return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
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
            onClick={() => onNavigate && onNavigate('/')}
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <TrendingUp size={28} style={{ color: '#6366f1' }} />
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0'
            }}>
              Education News & Updates
            </h1>
          </div>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: '0'
          }}>
            Stay informed with the latest developments in education
          </p>
        </div>

        {/* News Feed */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {newsData.map(news => {
            const categoryStyle = getCategoryColor(news.category);
            return (
              <div
                key={news.id}
                onClick={() => alert('Opening news article: ' + news.headline)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: categoryStyle.bg,
                    color: categoryStyle.text,
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: `1px solid ${categoryStyle.border}`
                  }}>
                    <Tag size={14} />
                    {news.category}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#94a3b8',
                    fontSize: '13px'
                  }}>
                    <Calendar size={14} />
                    {new Date(news.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 10px 0',
                  lineHeight: '1.4'
                }}>
                  {news.headline}
                </h3>

                <p style={{
                  fontSize: '15px',
                  color: '#64748b',
                  lineHeight: '1.6',
                  margin: '0'
                }}>
                  {news.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EducationNews;