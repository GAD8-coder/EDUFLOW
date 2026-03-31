import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { generateConceptMap } from '../../lib/groq';
import { X, Map, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const ConceptMap = ({ resource, onClose }) => {
  const { updateResource } = useApp();
  const [conceptData, setConceptData] = useState(resource.conceptMapData);
  const [isLoading, setIsLoading] = useState(!resource.conceptMapData);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!conceptData) {
      generateMap();
    }
  }, []);

  const generateMap = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await generateConceptMap(resource.extractedText);
      setConceptData(data);
      updateResource(resource.id, { conceptMapData: data });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple force-directed layout
  const calculateLayout = () => {
    if (!conceptData?.nodes?.length) return [];
    
    const centerX = 400;
    const centerY = 250;
    const radius = 150;
    
    // Sort by importance
    const sortedNodes = [...conceptData.nodes].sort((a, b) => {
      const imp = { high: 3, medium: 2, low: 1 };
      return imp[b.importance] - imp[a.importance];
    });
    
    // Place highest importance at center, others in a circle
    return sortedNodes.map((node, i) => {
      if (i === 0) return { ...node, x: centerX, y: centerY };
      const angle = ((i - 1) / (sortedNodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
      const dist = radius + (node.importance === 'high' ? 0 : node.importance === 'medium' ? 50 : 100);
      return {
        ...node,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist
      };
    });
  };

  const nodes = calculateLayout();
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const getNodeColor = (importance) => {
    switch (importance) {
      case 'high': return '#00ff87';
      case 'medium': return '#3b82f6';
      default: return 'var(--border)';
    }
  };

  const getNodeSize = (importance) => {
    switch (importance) {
      case 'high': return { w: 140, h: 60 };
      case 'medium': return { w: 120, h: 50 };
      default: return { w: 100, h: 40 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="notion-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Map size={20} style={{ color: 'var(--accent)' }} />
            <h3 className="font-heading text-xl">Concept Map</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
              <ZoomOut size={16} />
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 rounded" style={{ background: 'var(--surface-hover)' }}>
              <ZoomIn size={16} />
            </button>
            <button onClick={generateMap} disabled={isLoading} className="notion-small-button ml-2">
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="ml-2" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RotateCcw size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Generating concept map...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">⚠️ {error}</p>
            <button onClick={generateMap} className="notion-button">
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* SVG Map */}
            <div className="concept-map-container flex-1">
              <svg width="800" height="500" viewBox="0 0 800 500" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
                {/* Edges */}
                {conceptData?.edges?.map((edge, i) => {
                  const from = nodeMap[edge.from];
                  const to = nodeMap[edge.to];
                  if (!from || !to) return null;
                  
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2;
                  
                  return (
                    <g key={i}>
                      <line
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        stroke="var(--border)"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={midX} y={midY}
                        className="concept-edge-label"
                        textAnchor="middle"
                        dy="-5"
                      >
                        {edge.relationship}
                      </text>
                    </g>
                  );
                })}
                
                {/* Arrow marker */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="var(--border)" />
                  </marker>
                </defs>
                
                {/* Nodes */}
                {nodes.map((node) => {
                  const size = getNodeSize(node.importance);
                  return (
                    <g 
                      key={node.id} 
                      className="concept-node"
                      onClick={() => setSelectedNode(node)}
                      transform={`translate(${node.x - size.w/2}, ${node.y - size.h/2})`}
                    >
                      <rect
                        width={size.w}
                        height={size.h}
                        rx="8"
                        fill="var(--surface)"
                        stroke={getNodeColor(node.importance)}
                        strokeWidth={node.importance === 'high' ? 3 : 2}
                      />
                      <text
                        x={size.w/2}
                        y={size.h/2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--text-primary)"
                        fontSize={node.importance === 'high' ? 14 : 12}
                        fontWeight={node.importance === 'high' ? 600 : 400}
                      >
                        {node.label.length > 20 ? node.label.slice(0, 17) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar with selected node */}
            <div className="w-64 overflow-y-auto">
              {selectedNode ? (
                <div className="notion-card">
                  <h4 className="font-heading text-lg mb-2" style={{ color: getNodeColor(selectedNode.importance) }}>
                    {selectedNode.label}
                  </h4>
                  <span className="text-xs px-2 py-1 rounded mb-3 inline-block" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                    {selectedNode.importance} importance
                  </span>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedNode.description}
                  </p>
                </div>
              ) : (
                <div className="notion-card text-center">
                  <p style={{ color: 'var(--text-muted)' }}>Click a node to see details</p>
                </div>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#00ff87' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>High importance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#3b82f6' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Medium importance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: 'var(--border)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Low importance</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ConceptMap;
