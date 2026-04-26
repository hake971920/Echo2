import { useEffect, useRef, useState } from 'react';
import { Note, getNotes, getRelations, createRelation, autoLinkNotes } from './api';

interface GraphNode extends Note {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphLink {
  id: string;
  source: GraphNode;
  target: GraphNode;
  weight: number;
}

export function KnowledgeGraph({ onSelectNote }: { onSelectNote?: (note: Note) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [linkingMode, setLinkingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef<number>();

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const dist = radius * (0.3 + Math.random() * 0.7);
      if (node.x === 0 && node.y === 0) {
        node.x = centerX + Math.cos(angle) * dist;
        node.y = centerY + Math.sin(angle) * dist;
      }
      node.vx = 0;
      node.vy = 0;
    });

    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach(node => {
        node.vx += (Math.random() - 0.5) * 0.5;
        node.vy += (Math.random() - 0.5) * 0.5;
        node.vx *= 0.98;
        node.vy *= 0.98;
        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(30, Math.min(canvas.width - 30, node.x));
        node.y = Math.max(30, Math.min(canvas.height - 30, node.y));
      });

      links.forEach(link => {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 150) * 0.01;
        
        if (dist > 0) {
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          link.source.vx += fx * link.weight;
          link.source.vy += fy * link.weight;
          link.target.vx -= fx * link.weight;
          link.target.vy -= fy * link.weight;
        }
      });

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      nodes.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
      });

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      links.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      });

      nodes.forEach(node => {
        const isSelected = selectedNode?.id === node.id;
        const radius = isSelected ? 18 : 12;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#3b82f6' : '#6366f1';
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const label = node.summary?.slice(0, 8) || node.content.slice(0, 8);
        ctx.fillText(label, node.x, node.y);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, links, selectedNode]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const [notes, relations] = await Promise.all([getNotes(), getRelations()]);
      const noteMap = new Map(notes.map(n => [n.id, { ...n, x: 0, y: 0, vx: 0, vy: 0 }]));

      const graphLinks: GraphLink[] = relations
        .filter(r => noteMap.has(r.source_id) && noteMap.has(r.target_id))
        .map(r => ({
          id: r.id,
          source: noteMap.get(r.source_id)!,
          target: noteMap.get(r.target_id)!,
          weight: r.weight,
        }));

      setNodes(Array.from(noteMap.values()));
      setLinks(graphLinks);
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedNode) {
      if (linkingMode && selectedNode && selectedNode.id !== clickedNode.id) {
        try {
          await createRelation(selectedNode.id, clickedNode.id);
          await loadGraph();
          setLinkingMode(false);
          setSelectedNode(null);
        } catch (error) {
          console.error('Failed to create relation:', error);
        }
      } else {
        setSelectedNode(clickedNode);
        onSelectNote?.(clickedNode);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const handleAutoLink = async () => {
    setLoading(true);
    try {
      await autoLinkNotes();
      await loadGraph();
    } catch (error) {
      console.error('Failed to auto-link:', error);
    } finally {
      setLoading(false);
    }
};

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载图谱中...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
      />
      
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={handleAutoLink}
          disabled={loading}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '计算中...' : '自动关联'}
        </button>
        
        {selectedNode && (
          <button
            onClick={() => setLinkingMode(!linkingMode)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              linkingMode ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-gray-300`}
          >
            {linkingMode ? '选择目标笔记' : '关联其他笔记'}
          </button>
        )}
      </div>

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-h-32 overflow-y-auto">
          <div className="font-medium text-sm mb-1">
            {selectedNode.summary || selectedNode.content.slice(0, 50)}
          </div>
          <div className="flex gap-1 flex-wrap">
            {selectedNode.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
