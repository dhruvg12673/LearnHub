import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, BookOpen, FileText, StickyNote, ExternalLink, Plus, X, Upload } from 'lucide-react';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import './home.css'; // Import Home styles for Modal
import './CodingSessions.css'; // Reuse modal and button styles

const Library = ({ onNavigate }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'Article',
      category: '',
      file: null
  });

  useEffect(() => {
      fetchResources();
      if (user && user.id) {
          fetchRecommendations(user.id);
      }
  }, [user]);

  const fetchResources = async () => {
    try {
        const data = await resourcesApi.getAll();
        setResources(data);
    } catch (error) {
        console.error("Failed to load resources", error);
    } finally {
        setLoading(false);
    }
  };

  const fetchRecommendations = async (userId) => {
      console.log(`%c[DEBUG] Fetching recommendations for User ID: ${userId}`, "color: blue; font-weight: bold;");
      try {
          const startTime = performance.now();
          const data = await resourcesApi.getRecommendations(userId);
          const endTime = performance.now();
          
          console.log(`%c[DEBUG] Recommendations fetched in ${(endTime - startTime).toFixed(2)}ms`, "color: green");
          console.table(data); // Nice table view of recs
          
          setRecommendations(data);
      } catch (error) {
          console.error("%c[DEBUG] Failed to fetch recommendations", "color: red; font-weight: bold;", error);
      }
  };

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          setFormData({ ...formData, file: e.target.files[0] });
      }
  };

  const handleUpload = async (e) => {
      e.preventDefault();
      if (!formData.file || !formData.title || !formData.type) return;

      setUploading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('type', formData.type);
      data.append('category', formData.category);
      data.append('file', formData.file);
      if (user) data.append('user_id', user.id);

      try {
          await resourcesApi.upload(data);
          setShowModal(false);
          setFormData({ title: '', description: '', type: 'Article', category: '', file: null });
          fetchResources(); // Refresh list
      } catch (error) {
          console.error("Upload failed", error);
          alert("Failed to upload resource");
      } finally {
          setUploading(false);
      }
  };

  // Filter resources based on search
  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (resource.category && resource.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDownload = async (resource) => {
    try {
      // If it's a file, download it. If it's just a link (future proofing), open it.
      if (resource.id) {
          await resourcesApi.download(resource.id, resource.filename || 'resource');
      }
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download resource");
    }
  };

  const handleDelete = async (e, id) => {
      e.stopPropagation(); // Prevent opening/downloading
      if (window.confirm("Are you sure you want to delete this resource?")) {
          try {
              await resourcesApi.delete(id);
              fetchResources();
          } catch (err) {
              console.error("Delete failed", err);
          }
      }
  };

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
      padding: '20px',
      position: 'relative' // For FAB
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingBottom: '80px' // Space for FAB
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
            Discover books, articles, and upload your own notes to enhance your learning
          </p>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                     <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
                        <BookOpen size={20} />
                     </div>
                     <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Recommended for You</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Based on your recent learning paths</p>
                     </div>
                </div>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {recommendations.map(resource => (
                        <div
                            key={`rec-${resource.id}`}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                                border: '1px solid #e2e8f0',
                                position: 'relative'
                            }}
                        >
                            <div style={{ 
                                position: 'absolute', 
                                top: '12px', 
                                right: '12px', 
                                background: '#10b981', 
                                color: 'white', 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: '600'
                            }}>
                                Match
                            </div>

                             <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: getTypeColor(resource.type),
                                marginBottom: '8px'
                            }}>
                                {getTypeIcon(resource.type)}
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>{resource.type}</span>
                            </div>
                            
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>
                                {resource.title}
                            </h3>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {resource.description}
                            </p>
                             <button
                                onClick={() => handleDownload(resource)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    color: '#475569',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                View Resource
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

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
              placeholder="Search books, notes, or resources..."
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
           {loading ? (
             <p>Loading resources...</p>
           ) : (
            filteredResources.map(resource => (
                <div
                key={resource.id}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
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
                <button 
                    onClick={(e) => handleDelete(e, resource.id)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                    title="Delete Resource"
                >
                    <X size={16} />
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingRight: '20px' 
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
                    borderRadius: '4px',
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
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
                    margin: '0 0 16px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: '3',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {resource.description}
                </p>

                <button
                    onClick={() => handleDownload(resource)}
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
                    Download / Open
                </button>
                </div>
            ))
           )}
        </div>

        {/* Empty State */}
        {!loading && filteredResources.length === 0 && (
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
              Try uploading a new resource or adjusting your search
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Upload */}
      <button
        onClick={() => setShowModal(true)}
        style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'white',
            color: '#6366f1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            zIndex: 1000
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Upload Resource"
      >
          <Plus size={24} />
      </button>

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1001 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Upload Resource</h2>
              <button 
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Title</label>
                    <input 
                        type="text" 
                        required 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                    <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type</label>
                        <select
                             value={formData.type}
                             onChange={(e) => setFormData({...formData, type: e.target.value})}
                             style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        >
                            <option value="Article">Article</option>
                            <option value="Book">Book</option>
                            <option value="Notes">Notes</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
                        <input 
                            type="text"
                            placeholder="e.g. Math"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Upload File</label>
                    <div style={{ 
                        border: '2px dashed #cbd5e1', 
                        borderRadius: '8px', 
                        padding: '20px', 
                        textAlign: 'center',
                        cursor: 'pointer'
                    }} onClick={() => document.getElementById('fileInput').click()}>
                         <Upload size={24} style={{ color: '#64748b', marginBottom: '8px' }} />
                         <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                             {formData.file ? formData.file.name : "Click to select file"}
                         </p>
                        <input 
                            id="fileInput"
                            type="file" 
                            required
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={uploading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.7 : 1
                    }}
                >
                    {uploading ? 'Uploading...' : 'Upload Resource'}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

};

export default Library;