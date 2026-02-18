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
import TutorChat from '../components/TutorChat';
import { Brain, ArrowLeft, Loader2, BookOpen, Plus, X } from 'lucide-react';
import './RoadmapView.css';
import './home.css'; // Import global styles for Modal

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
  
  // Add Node Modal State
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");

  const contentCache = useRef({});

  useEffect(() => {
    fetchRoadmapData();
  }, [id]);

  const processRoadmapData = (data) => {
    // If we have saved nodes/edges, use them directly
    if (data.nodes && data.edges) {
       // Need to ensure custom types are set correctly if not saved in DB
       const formattedNodes = data.nodes.map(n => ({
         ...n,
         type: 'custom', // Ensure type is custom
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
      console.log("Fetched Roadmap Data:", data); // Debug log
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
      // Strip out non-serializable parts if any, but ReactFlow nodes are usually fine
      // We need to save the exact position
      await updateRoadmap(id, currentNodes, currentEdges);
    } catch (error) {
      console.error("Failed to save roadmap state", error);
    }
  };

  const handleOpenAddNodeModal = () => {
      setNewNodeLabel("");
      setIsAddNodeModalOpen(true);
  };

  const handleConfirmAddNode = (e) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const label = newNodeLabel;
    
    // Place in center of view approximately (using viewport center or fixed offset from first node)
    // A better way is to find a gap or just place at top left of view
    const { x, y, zoom } = getViewport();
    
    // Simplification: Place it near the last selected node or at (100, 100) if none
    let spawnX = 100;
    let spawnY = 100;
    
    if (nodes.length > 0) {
        // Just offset from first node for now, or find center
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
      // Important to set draggable true (default)
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    // We don't connect immediately, user drags it to desired location
    // Or we could connect to nearest immediately. Let's do nearest immediately for better UX
    
    let nearestNode = null;
    let minDistance = Infinity;

    // Use current nodes state
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
    
    // Close modal
    setIsAddNodeModalOpen(false);
  };

  const handleAddNode = useCallback(() => {
    // Legacy function kept for ref or if passed as prop, but we switch to modal
    handleOpenAddNodeModal();
  }, [nodes, edges, getViewport, id]);

  const onNodeDragStop = useCallback(
    (event, node, nodes) => {
        // When drag stops, find nearest node and re-connect
        // We only want to auto-connect 'custom' nodes or maybe all nodes?
        // Let's stick to only affecting edges for this specific node
        
        // Find nearest node excluding itself and its own descendants (to prevent cycles - simple check: exclude self)
        // For simple tree strictness we should avoid descendants, but for general graph it's okay.
        // Let's just find nearest node that is NOT self.
        
        let nearestNode = null;
        let minDistance = Infinity;
        
        // Helper to get distance
        const getDistance = (n1, n2) => {
            const dx = n1.position.x - n2.position.x;
            const dy = n1.position.y - n2.position.y;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // We need to access the LATEST nodes state. 
        // ReactFlow onNodeDragStop passes (event, node, nodes). stored in 'nodes' param (v11) is list of *all* nodes? 
        // Docs say: onNodeDragStop(event, node, nodes) 
        // node is the dragged node. nodes is the array of all nodes.

        // Wait, v11 onNodeDragStop signature is (event, node, nodes).
        
        // NOTE: If we want to change parent, we remove old incoming edge and add new one.
        // Identify incoming edge: target == node.id
        
        const allNodes = getNodes(); // Use getter to be safe or use provided nodes
        
        allNodes.forEach(n => {
            if (n.id === node.id) return;
            const d = getDistance(node, n);
            if (d < minDistance) {
                minDistance = d;
                nearestNode = n;
            }
        });

        if (nearestNode) {
            // Check if edge already exists
            const edgeExists = edges.some(e => 
                (e.source === nearestNode.id && e.target === node.id) ||
                (e.source === node.id && e.target === nearestNode.id)
            );

            if (!edgeExists) {
                // Remove OLD parent edge (incoming to this node)
                // We assume tree structure where node has 1 parent. 
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
                // Just save new position
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
        id,
        roadmapData.interest || null
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
        id,
        roadmapData.interest || null
      );
      setContentData(data);
      contentCache.current[cacheKey] = data;
    } catch (error) {
      console.error("Failed to change mode", error);
    } finally {
      setContentLoading(false);
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
      {/* Top Bar */}
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

      {/* Main Content */}
      <div className="roadmap-main">
        {/* Left Panel - Roadmap */}
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

        {/* Right Panel - Content */}
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
            roadmapId={id}
            interest={roadmapData?.interest}
          />
          {roadmapData?.topic && (
              <TutorChat topic={roadmapData.topic} />
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {isAddNodeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddNodeModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Topic</h2>
              <button 
                className="modal-close"
                onClick={() => setIsAddNodeModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleConfirmAddNode} style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>
                        Topic Name
                    </label>
                    <input 
                        type="text" 
                        autoFocus
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        placeholder="e.g. Advanced State Management"
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            borderRadius: '6px', 
                            border: '1px solid #cbd5e1',
                            fontSize: '15px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                     <button
                        type="button"
                        onClick={() => setIsAddNodeModalOpen(false)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                     >
                         Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={!newNodeLabel.trim()}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            opacity: newNodeLabel.trim() ? 1 : 0.6
                        }}
                     >
                         Add Topic
                     </button>
                </div>
            </form>
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