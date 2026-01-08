import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { getRoadmap, updateRoadmap } from '../api/roadmap';
import { generateContent } from '../api/content';
import ContentPanel from '../components/ContentPanel';
import { Brain, ArrowLeft, Loader2, BookOpen, Plus, Check, X } from 'lucide-react';
import './RoadmapView.css';

const nodeWidth = 180;
const nodeHeight = 70;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const CustomNode = ({ data, selected }) => {
  const getStatusClass = () => {
    if (selected) return 'custom-node-selected';
    
    switch (data.status) {
      case 'expert':
        return 'custom-node-expert';
      case 'completed':
        return 'custom-node-completed';
      case 'competent':
        return 'custom-node-competent';
      default:
        return 'custom-node-default';
    }
  };

  return (
    <div className={`custom-node ${getStatusClass()}`}>
      <Handle type="target" position={Position.Top} className="custom-handle" />
      <div className="custom-node-content">
        <div className="custom-node-header">
          <span className="node-id-badge">{data.nodeId}</span>
          <span className="node-label">{data.label}</span>
        </div>
        {data.mastery_score > 0 && (
          <div className="mastery-progress-bar">
            <div 
              className="mastery-progress-fill" 
              style={{ width: `${data.mastery_score}%` }}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const RoadmapContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project, screenToFlowPosition, getNodes, getZoom, getViewport } = useReactFlow();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('story');
  const contentCache = useRef({});
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showTopicAddedModal, setShowTopicAddedModal] = useState(false);
  const [addedTopicName, setAddedTopicName] = useState('');

  useEffect(() => {
    fetchRoadmapData();
  }, [id]);

  const processRoadmapData = (data) => {
    if (data.nodes && data.edges) {
       const formattedNodes = data.nodes.map(n => ({
         ...n,
         type: 'custom',
         data: { ...n.data, nodeId: n.id }
       }));
       return { nodes: formattedNodes, edges: data.edges, isSavedState: true };
    }

    const newNodes = [];
    const newEdges = [];
    
    const traverse = (node, parentId = null) => {
      newNodes.push({
        id: node.id,
        type: 'custom',
        data: { 
          label: node.label,
          nodeId: node.id,
          status: node.status,
          mastery_score: node.mastery_score
        },
        position: { x: 0, y: 0 },
      });

      if (parentId) {
        newEdges.push({
          id: `e${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        });
      }

      if (node.children) {
        node.children.forEach((child) => traverse(child, node.id));
      }
    };

    data.roadmap.forEach((rootNode) => traverse(rootNode));
    return { nodes: newNodes, edges: newEdges, isSavedState: false };
  };

  const fetchRoadmapData = async () => {
    try {
      const data = await getRoadmap(id);
      setRoadmapData(data);
      const { nodes: processedNodes, edges: processedEdges, isSavedState } = processRoadmapData(data);
      
      if (isSavedState) {
          setNodes(processedNodes);
          setEdges(processedEdges);
      } else {
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(processedNodes, processedEdges, 'TB');
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
      }
    } catch (error) {
      console.error("Failed to fetch roadmap", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRoadmapState = async (currentNodes, currentEdges) => {
    try {
      await updateRoadmap(id, currentNodes, currentEdges);
    } catch (error) {
      console.error("Failed to save roadmap state", error);
    }
  };

  const handleAddNode = useCallback(() => {
    setNewTopicInput('');
    setShowAddTopicModal(true);
  }, []);

  const handleSubmitNewTopic = useCallback(() => {
    const label = newTopicInput.trim();
    if (!label) return;

    const { x, y, zoom } = getViewport();
    
    let spawnX = 100;
    let spawnY = 100;
    
    if (nodes.length > 0) {
        spawnX = -x / zoom + 250; 
        spawnY = -y / zoom + 100;
    }

    const newNodeId = `user-node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: { x: spawnX, y: spawnY },
      data: { 
          label: label, 
          nodeId: newNodeId, 
          status: 'novice', 
          mastery_score: 0 
      },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    let nearestNode = null;
    let minDistance = Infinity;

    nodes.forEach(node => {
      const dx = node.position.x - spawnX;
      const dy = node.position.y - spawnY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });

    let newEdges = [...edges];
    if (nearestNode) {
         const newEdge = {
          id: `e${nearestNode.id}-${newNodeId}`,
          source: nearestNode.id,
          target: newNodeId,
          type: 'smoothstep',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        };
        newEdges.push(newEdge);
    }

    setEdges(newEdges);
    saveRoadmapState(newNodes, newEdges);
    
    setShowAddTopicModal(false);
    setAddedTopicName(label);
    setShowTopicAddedModal(true);

  }, [nodes, edges, getViewport, id, newTopicInput]);

  const onNodeDragStop = useCallback(
    (event, node, nodes) => {
        let nearestNode = null;
        let minDistance = Infinity;
        
        const getDistance = (n1, n2) => {
            const dx = n1.position.x - n2.position.x;
            const dy = n1.position.y - n2.position.y;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const allNodes = getNodes();
        
        allNodes.forEach(n => {
            if (n.id === node.id) return;
            const d = getDistance(node, n);
            if (d < minDistance) {
                minDistance = d;
                nearestNode = n;
            }
        });

        if (nearestNode) {
            const edgeExists = edges.some(e => 
                (e.source === nearestNode.id && e.target === node.id) ||
                (e.source === node.id && e.target === nearestNode.id)
            );

            if (!edgeExists) {
                const otherEdges = edges.filter(e => e.target !== node.id);
                
                const newEdge = {
                    id: `e${nearestNode.id}-${node.id}-${Date.now()}`,
                    source: nearestNode.id,
                    target: node.id,
                    type: 'smoothstep',
                    style: { stroke: '#cbd5e1', strokeWidth: 2 },
                };
                
                const updatedEdges = [...otherEdges, newEdge];
                setEdges(updatedEdges);
                saveRoadmapState(allNodes, updatedEdges);
            } else {
                 saveRoadmapState(allNodes, edges);
            }
        } else {
             saveRoadmapState(allNodes, edges);
        }
    },
    [edges, getNodes, id]
  );
  
  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      saveRoadmapState(nodes, newEdges);
    },
    [edges, nodes, id],
  );

  const getExistingMedia = (nodeLabel) => {
    const cache = contentCache.current;
    for (const key in cache) {
      if (key.startsWith(`${nodeLabel}-`)) {
        const data = cache[key];
        if (data?.images?.length || data?.videos?.length) {
          return { images: data.images, videos: data.videos };
        }
      }
    }
    return { images: null, videos: null };
  };

  const handleNodeClick = async (event, node) => {
    setSelectedNode(node);
    
    const cacheKey = `${id}-${node.data.label}-${currentMode}`;
    if (contentCache.current[cacheKey]) {
      setContentData(contentCache.current[cacheKey]);
      return;
    }

    setContentLoading(true);
    setContentData(null);
    
    const { images, videos } = getExistingMedia(node.data.label);

    try {
      const data = await generateContent(
        roadmapData.topic, 
        node.data.label, 
        currentMode, 
        roadmapData.difficulty || 'Normal', 
        roadmapData.language || 'English', 
        images, 
        videos,
        id
      );
      setContentData(data);
      contentCache.current[cacheKey] = data;
    } catch (error) {
      console.error("Failed to fetch content", error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleModeChange = async (mode) => {
    setCurrentMode(mode);
    if (!selectedNode) return;

    const cacheKey = `${id}-${selectedNode.data.label}-${mode}`;
    if (contentCache.current[cacheKey]) {
      setContentData(contentCache.current[cacheKey]);
      return;
    }

    setContentLoading(true);
    
    const { images, videos } = getExistingMedia(selectedNode.data.label);

    try {
      const data = await generateContent(
        roadmapData.topic, 
        selectedNode.data.label, 
        mode, 
        roadmapData.difficulty || 'Normal', 
        roadmapData.language || 'English', 
        images, 
        videos,
        id
      );
      setContentData(data);
      contentCache.current[cacheKey] = data;
    } catch (error) {
      console.error("Failed to change mode", error);
    } finally {
      setContentLoading(false);
    }
  };

  // Called when a quiz completes (or when parent wants roadmap refreshed)
  const handleQuizComplete = async (result, subtopicLabel) => {
    try {
      // Immediately update UI for immediate feedback
      const updatedNodes = nodes.map(n => {
        if (n.data && n.data.label === subtopicLabel) {
          return {
            ...n,
            data: {
              ...n.data,
              status: result && result.score >= 60 ? 'completed' : n.data.status,
              mastery_score: result && result.knowledge_update ? result.knowledge_update.mastery : (result ? result.score : n.data.mastery_score)
            }
          };
        }
        return n;
      });

      setNodes(updatedNodes);
      // Save the layout/node updates to roadmap structure (this only updates roadmap_json nodes/edges)
      saveRoadmapState(updatedNodes, edges);

      // Refresh authoritative roadmap data from server (user_knowledge was updated by backend)
      await fetchRoadmapData();
    } catch (err) {
      console.error('Error handling quiz completion', err);
    }
  };

  if (loading) {
    return (
      <div className="roadmap-loading">
        <Loader2 className="loading-spinner" size={40} />
        <span className="loading-text">Loading your learning path...</span>
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <div className="header-left">
          <button 
            onClick={() => navigate('/')}
            className="back-button"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-logo">
            <div className="logo-icon">
              <Brain size={20} />
            </div>
            <span className="logo-text">LearnHub</span>
          </div>
          <div className="header-divider"></div>
          <div className="roadmap-info">
            <BookOpen size={18} className="roadmap-icon" />
            <h2 className="roadmap-title">{roadmapData?.topic}</h2>
          </div>
          <div className="header-actions" style={{ marginLeft: '1rem' }}>
             <button onClick={handleAddNode} className="add-node-btn" style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 padding: '0.5rem 1rem',
                 backgroundColor: '#3b82f6',
                 color: 'white',
                 border: 'none',
                 borderRadius: '0.5rem',
                 cursor: 'pointer',
                 fontSize: '0.875rem',
                 fontWeight: '500'
             }}>
                <Plus size={16} />
                Add Topic
             </button>
          </div>
        </div>
      </div>

      <div className="roadmap-main">
        <div className="roadmap-panel">
          <div className="panel-header">
            <h3 className="panel-title">Learning Path</h3>
            <p className="panel-subtitle">Click on any node to explore</p>
          </div>
          <div className="reactflow-wrapper">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.3}
              maxZoom={1.5}
            >
              <Controls className="flow-controls" />
              <Background variant="dots" gap={16} size={1} color="#e2e8f0" />
            </ReactFlow>
          </div>
        </div>

        <div className="content-panel-wrapper">
          <ContentPanel 
            data={contentData}
            topic={roadmapData?.topic}
            subtopic={selectedNode?.data?.label}
            onModeChange={handleModeChange}
            loading={contentLoading}
            currentMode={currentMode}
            difficulty={roadmapData?.difficulty}
            language={roadmapData?.language}
            roadmapId={id}            onQuizComplete={handleQuizComplete}          />
        </div>
      </div>

      {showAddTopicModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }} onClick={() => setShowAddTopicModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '0.5rem'
              }}>
                Add New Topic
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                Enter a title for the new subtopic
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '0.5rem'
              }}>
                Topic Title
                <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
              </label>
              <input
                type="text"
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                placeholder="e.g., Introduction to Algorithms"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitNewTopic();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#0f172a',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowAddTopicModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewTopic}
                disabled={!newTopicInput.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  background: newTopicInput.trim() ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: newTopicInput.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: newTopicInput.trim() ? '0 4px 6px -1px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'all 0.2s',
                  opacity: newTopicInput.trim() ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (newTopicInput.trim()) {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newTopicInput.trim()) {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopicAddedModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setShowTopicAddedModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                padding: '0.25rem',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check size={32} style={{ color: '#2563eb' }} />
            </div>
            
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '0.75rem',
              textAlign: 'center',
              lineHeight: '1.3'
            }}>
              Topic Added Successfully
            </h3>
            
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              marginBottom: '2rem',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              {addedTopicName}
            </p>
            
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: '#64748b', 
                  fontWeight: '600' 
                }}>
                  Progress
                </span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: '#0f172a', 
                  fontWeight: '600' 
                }}>
                  0%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '9999px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '0%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
            
            <button
              onClick={() => setShowTopicAddedModal(false)}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RoadmapView = () => (
  <ReactFlowProvider>
    <RoadmapContent />
  </ReactFlowProvider>
);

export default RoadmapView;