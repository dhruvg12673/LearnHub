import React, { useState } from 'react';
import { ArrowLeft, Search, BookOpen, FileText, StickyNote, ExternalLink } from 'lucide-react';

const Library = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allResources = [
    {
      id: 1,
      title: 'Operating Systems Concepts',
      description: 'Comprehensive guide to OS fundamentals including processes, threads, memory management',
      type: 'Book',
      category: 'Computer Science'
    },
    {
      id: 2,
      title: 'Data Structures and Algorithms',
      description: 'Complete reference for DSA with detailed explanations and practice problems',
      type: 'Book',
      category: 'Programming'
    },
    {
      id: 3,
      title: 'Machine Learning Basics',
      description: 'Introduction to ML concepts, supervised and unsupervised learning techniques',
      type: 'Article',
      category: 'AI/ML'
    },
    {
      id: 4,
      title: 'Database Management Systems',
      description: 'SQL, NoSQL, normalization, indexing, and query optimization notes',
      type: 'Notes',
      category: 'Database'
    },
    {
      id: 5,
      title: 'Web Development Fundamentals',
      description: 'HTML, CSS, JavaScript basics and modern web development practices',
      type: 'Article',
      category: 'Web Development'
    },
    {
      id: 6,
      title: 'Computer Networks',
      description: 'Network layers, protocols, TCP/IP, routing, and network security',
      type: 'Book',
      category: 'Networking'
    },
    {
      id: 7,
      title: 'Python Programming Guide',
      description: 'From basics to advanced Python programming with real-world examples',
      type: 'Notes',
      category: 'Programming'
    },
    {
      id: 8,
      title: 'Artificial Intelligence Overview',
      description: 'AI history, search algorithms, knowledge representation, and expert systems',
      type: 'Article',
      category: 'AI/ML'
    }
  ];

  const filteredResources = allResources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Book':
        return <BookOpen size={18} />;
      case 'Article':
        return <FileText size={18} />;
      case 'Notes':
        return <StickyNote size={18} />;
      default:
        return <BookOpen size={18} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Book':
        return '#6366f1';
      case 'Article':
        return '#10b981';
      case 'Notes':
        return '#f59e0b';
      default:
        return '#6366f1';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
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
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            Learning Resources & Library
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: '0'
          }}>
            Discover books, articles, and notes to enhance your learning
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            position: 'relative'
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, notes, or resources (e.g. Operating Systems)"
              style={{
                width: '100%',
                padding: '14px 14px 14px 48px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          marginBottom: '16px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} found
        </div>

        {/* Resources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredResources.map(resource => (
            <div
              key={resource.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: getTypeColor(resource.type)
                }}>
                  {getTypeIcon(resource.type)}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {resource.type}
                  </span>
                </div>
                <span style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  backgroundColor: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {resource.category}
                </span>
              </div>

              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 8px 0'
              }}>
                {resource.title}
              </h3>

              <p style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}>
                {resource.description}
              </p>

              <button
                onClick={() => alert('Opening resource: ' + resource.title)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ExternalLink size={16} />
                Open Resource
              </button>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Search size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              No resources found
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0'
            }}>
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;