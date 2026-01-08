import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { generateRoadmap } from '../api/roadmap';
import { generateContent } from '../api/content';
import ContentModal from './ContentModal';
import { Brain, Loader2, Lightbulb } from 'lucide-react';
import './RoadmapView.css';

// Constants for layout
const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

// Layout function using dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Process roadmap JSON into ReactFlow format
const processRoadmapData = (data) => {
  const nodes = [];
  const edges = [];

  const traverse = (node, parentId = null) => {
    nodes.push({
      id: node.id,
      data: { label: node.label, description: node.description },
      position: { x: 0, y: 0 },
      type: 'default',
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        animated: false,
      });
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child, node.id));
    }
  };

  data.roadmap.forEach((rootNode) => traverse(rootNode));
  return { nodes, edges };
};

const RoadmapView = () => {
  // Roadmap State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Normal');
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [roadmapId, setRoadmapId] = useState(null);

  // Content Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState('story');

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Generate Roadmap
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setNodes([]);
    setEdges([]);
    
    try {
      const data = await generateRoadmap(topic, difficulty);
      setRoadmapId(data.id);
      const { nodes: rawNodes, edges: rawEdges } = processRoadmapData(data.roadmap);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      alert('Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Node Click
  const handleNodeClick = useCallback(async (event, node) => {
    setSelectedNode(node);
    setModalOpen(true);
    setContentLoading(true);
    setContentData(null);
    setCurrentMode('story');

    try {
      const data = await generateContent(topic, node.data.label, 'story', difficulty);
      setContentData(data);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setContentLoading(false);
    }
  }, [topic]);

  // Handle Mode Change
  const handleModeChange = useCallback(async (mode) => {
    if (!selectedNode || mode === currentMode) return;
    
    setContentLoading(true);
    setCurrentMode(mode);
    
    try {
      const data = await generateContent(topic, selectedNode.data.label, mode, difficulty);
      setContentData(data);
    } catch (error) {
      console.error('Failed to change mode:', error);
    } finally {
      setContentLoading(false);
    }
  }, [selectedNode, topic, currentMode]);

  // Close Modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedNode(null);
    setContentData(null);
  }, []);

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleGenerate();
    }
  };

  return (
    <div className="roadmap-view-container">
      {/* Header */}
      <header className="roadmap-view-header">
        <div className="header-wrapper">
          <div className="header-branding">
            <div className="branding-icon">
              <Brain className="icon-brain" />
            </div>
            <h1 className="branding-title">AdaptiveLearn</h1>
          </div>
          
          <div className="header-controls">
            <div className="difficulty-selector">
              <label className="selector-label">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="selector-input"
              >
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
                <option value="Difficult">Difficult</option>
              </select>
            </div>
            <div className="topic-input-group">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a topic (e.g., Machine Learning, Physics)"
                className="topic-input"
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="generate-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="button-spinner" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Brain className="button-icon" />
                    <span>Generate Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - ReactFlow */}
      <main className="roadmap-view-main">
        {nodes.length === 0 && !loading ? (
          <div className="empty-roadmap-state">
            <div className="empty-state-icon-wrapper">
              <Lightbulb className="empty-state-icon" />
            </div>
            <h2 className="empty-state-title">Create Your Learning Roadmap</h2>
            <p className="empty-state-description">
              Enter a topic above and let AI generate a personalized learning path
            </p>
            <div className="empty-state-features">
              <div className="feature-badge">
                <span className="badge-icon">🎯</span>
                <span>AI-Powered Paths</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">📚</span>
                <span>Interactive Learning</span>
              </div>
              <div className="feature-badge">
                <span className="badge-icon">🚀</span>
                <span>Adaptive Content</span>
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Controls position="bottom-left" className="flow-controls" />
            <MiniMap 
              position="bottom-right"
              nodeColor="#3b82f6"
              maskColor="rgba(0,0,0,0.1)"
              className="flow-minimap"
            />
            <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
          </ReactFlow>
        )}
      </main>

      {/* Content Modal */}
      {modalOpen && (
        <ContentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          data={contentData}
          topic={topic}
          subtopic={selectedNode?.data?.label}
          onModeChange={handleModeChange}
          loading={contentLoading}
          currentMode={currentMode}
          difficulty={difficulty}
          roadmapId={roadmapId}
        />
      )}
    </div>
  );
};

export default RoadmapView;