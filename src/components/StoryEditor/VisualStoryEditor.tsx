import React, { useState, useEffect, useRef } from 'react';
import './VisualStoryEditor.css';

interface StoryNode {
  id: number;
  title: string;
  text: string;
  choices: any[];
  rewards: any;
  route_name: string;
  node_type: string;
  x: number;
  y: number;
}

interface Connection {
  from: number;
  to: number;
  label: string;
}

interface VisualStoryEditorProps {
  nodes: StoryNode[];
  onNodeUpdate: (nodeId: number, data: any) => void;
  onNodeDelete: (nodeId: number) => void;
  onNodesChange: (nodes: StoryNode[]) => void;
}

const VisualStoryEditor: React.FC<VisualStoryEditorProps> = ({
  nodes,
  onNodeUpdate,
  onNodeDelete,
  onNodesChange
}) => {
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 6000, height: 4000 });

  // 디버깅: 노드 정보 출력
  useEffect(() => {
    console.log('📍 VisualStoryEditor - 노드 개수:', nodes.length);
    if (nodes.length > 0) {
      console.log('📍 첫 번째 노드 위치:', nodes[0].x, nodes[0].y);
      console.log('📍 viewOffset:', viewOffset);
      console.log('📍 zoom:', zoom);
    }
  }, [nodes, viewOffset, zoom]);

  // 캔버스 크기 조정
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // 캔버스 패닝 시작
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    }
  };

  // 캔버스 패닝 중
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedNode) {
      handleNodeDrag(e);
    }
  };

  // 캔버스 패닝 종료
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (draggedNode) {
      handleNodeDragEnd();
    }
  };

  // 줌 기능
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(2, prev * delta)));
  };

  // 노드 드래그 시작
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: e.clientX / zoom - node.x,
        y: e.clientY / zoom - node.y
      });
    }
  };

  // 노드 드래그 중
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const newX = (e.clientX - viewOffset.x) / zoom - dragOffset.x;
      const newY = (e.clientY - viewOffset.y) / zoom - dragOffset.y;
      
      const updatedNodes = nodes.map(node =>
        node.id === draggedNode
          ? { ...node, x: newX, y: newY }
          : node
      );
      
      onNodesChange(updatedNodes);
    }
  };

  // 노드 드래그 종료
  const handleNodeDragEnd = () => {
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 노드 클릭
  const handleNodeClick = (node: StoryNode) => {
    setSelectedNode(node);
  };

  // 편집 패널 닫기
  const handleCloseEditor = () => {
    setSelectedNode(null);
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      editorRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 노드 ID로 노드 찾기
  const findNodeById = (id: number) => nodes.find(n => n.id === id);

  // 선택지에서 다음 노드 ID 추출 (간단한 파싱)
  const extractTargetNodeId = (choice: any): number | null => {
    if (typeof choice === 'string') {
      // "[[텍스트->노드ID]]" 또는 "[[텍스트|노드ID]]" 형식 파싱
      const match = choice.match(/\[\[.*?(?:->|\|)(\d+)\]\]/) || choice.match(/\[\[(\d+)\]\]/);
      if (match) return parseInt(match[1]);
    } else if (choice.targetNodeId) {
      return choice.targetNodeId;
    }
    return null;
  };

  // 베지어 곡선으로 연결선 그리기
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    
    nodes.forEach(node => {
      if (node.choices && node.choices.length > 0) {
        node.choices.forEach((choice, index) => {
          const targetId = extractTargetNodeId(choice);
          const targetNode = targetId ? findNodeById(targetId) : null;
          
          if (targetNode) {
            // 시작점: 노드 오른쪽 중앙
            const startX = node.x + 100;
            const startY = node.y + 40;
            
            // 끝점: 타겟 노드 왼쪽 중앙
            const endX = targetNode.x;
            const endY = targetNode.y + 40;
            
            // 베지어 곡선 제어점
            const controlX1 = startX + (endX - startX) * 0.5;
            const controlY1 = startY;
            const controlX2 = startX + (endX - startX) * 0.5;
            const controlY2 = endY;
            
            const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
            
            connections.push(
              <g key={`${node.id}-${index}-${targetId}`}>
                <path
                  d={pathData}
                  stroke="#9ca3af"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          }
        });
      }
    });
    
    return connections;
  };

  return (
    <div ref={editorRef} className={`visual-story-editor ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 툴바 */}
      <div className="editor-toolbar">
        <button className="tool-btn">➕ 노드 추가</button>
        <button className="tool-btn" onClick={() => setZoom(1)}>
          🔍 줌 리셋 ({Math.round(zoom * 100)}%)
        </button>
        <button className="tool-btn" onClick={() => setViewOffset({ x: 0, y: 0 })}>
          🏠 중앙으로
        </button>
        <button className="tool-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '🗗 전체화면 종료' : '🗖 전체화면'}
        </button>
        <div style={{ marginLeft: 'auto', color: '#666', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
          마우스 휠: 줌 | 빈 공간 드래그: 캔버스 이동 | 노드 드래그: 위치 변경
        </div>
      </div>

      {/* 메인 편집 영역 */}
      <div className="editor-main">
        {/* 캔버스 */}
        <div 
          ref={canvasRef}
          className={`editor-canvas ${isPanning ? 'panning' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'move' : 'grab' }}
        >
          {/* SVG 연결선 레이어 */}
          <svg 
            className="connections-layer" 
            width="100%" 
            height="100%"
            style={{
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#667eea"
                />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {/* 노드들 */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`story-node ${selectedNode?.id === node.id ? 'selected' : ''} ${node.node_type} ${draggedNode === node.id ? 'dragging' : ''} ${node.id === nodes[0]?.id ? 'start' : ''}`}
              style={{ 
                left: node.x, 
                top: node.y,
                transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node);
              }}
              onMouseDown={(e) => handleNodeDragStart(e, node.id)}
            >
              <div className="node-header">
                <div className="node-title">{node.title}</div>
              </div>
              <div className="node-content">
                {node.text.length > 60 ? `${node.text.substring(0, 60)}...` : node.text}
              </div>
              {node.choices && node.choices.length > 0 && (
                <div className="node-choices">
                  <div className="choices-count">→ {node.choices.length}</div>
                </div>
              )}
              {node.route_name && (
                <div className="node-route">{node.route_name}</div>
              )}
            </div>
          ))}
        </div>

        {/* 편집 패널 */}
        {selectedNode && (
          <div className="editor-panel">
            <div className="panel-header">
              <h4>노드 편집 - {selectedNode.title}</h4>
              <button className="close-btn" onClick={handleCloseEditor}>✕</button>
            </div>
            <NodeEditor
              node={selectedNode}
              onSave={(data) => {
                onNodeUpdate(selectedNode.id, data);
                setSelectedNode(null);
              }}
              onDelete={() => {
                onNodeDelete(selectedNode.id);
                setSelectedNode(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 노드 편집 컴포넌트
interface NodeEditorProps {
  node: StoryNode;
  onSave: (data: any) => void;
  onDelete: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: node.title,
    text: node.text,
    choices: node.choices.map(choice => 
      typeof choice === 'string' 
        ? choice 
        : choice.label || choice.text || JSON.stringify(choice)
    ).join('|'),
    rewards: node.rewards ? Object.entries(node.rewards).map(([k, v]) => `${k}:${v}`).join(', ') : '',
    route_name: node.route_name || '',
  });

  const handleSave = () => {
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="node-editor-form">
      <div className="form-group">
        <label>제목</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="노드 제목"
        />
      </div>

      <div className="form-group">
        <label>내용</label>
        <textarea
          value={formData.text}
          onChange={(e) => handleInputChange('text', e.target.value)}
          placeholder="스토리 내용"
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>선택지 (|로 구분)</label>
        <textarea
          value={formData.choices}
          onChange={(e) => handleInputChange('choices', e.target.value)}
          placeholder="선택지 1|선택지 2|선택지 3"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>보상 (키:값,키:값 형태)</label>
        <input
          type="text"
          value={formData.rewards}
          onChange={(e) => handleInputChange('rewards', e.target.value)}
          placeholder="골드:100, 에너지:50"
        />
      </div>

      <div className="form-group">
        <label>루트 이름</label>
        <input
          type="text"
          value={formData.route_name}
          onChange={(e) => handleInputChange('route_name', e.target.value)}
          placeholder="루트 1, 루트 2 등"
        />
      </div>

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>
          💾 저장
        </button>
        <button className="delete-btn" onClick={onDelete}>
          🗑️ 삭제
        </button>
      </div>
    </div>
  );
};

export default VisualStoryEditor;
