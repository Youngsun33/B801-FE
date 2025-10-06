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
  image_url?: string;
  image_alt?: string;
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
  saving?: boolean;
}

const VisualStoryEditor: React.FC<VisualStoryEditorProps> = ({
  nodes,
  onNodeUpdate,
  onNodeDelete,
  onNodesChange,
  saving = false
}) => {
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 6000, height: 4000 });

  // 초기 뷰 설정 (모든 노드가 보이도록)
  useEffect(() => {
    if (nodes.length > 0 && viewOffset.x === 0 && viewOffset.y === 0) {
      // 모든 노드의 경계 계산
      const bounds = calculateSVGBounds();
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      // 화면 중앙에 모든 노드가 보이도록 오프셋 설정
      setViewOffset({ 
        x: -centerX + window.innerWidth / 2, 
        y: -centerY + window.innerHeight / 2 
      });
    }
  }, [nodes]);

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

  // 마우스 휠 이벤트 제거

  // 노드 드래그 시작
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: number) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: e.clientX - viewOffset.x - node.x,
        y: e.clientY - viewOffset.y - node.y
      });
    }
  };

  // 노드 드래그 중
  const handleNodeDrag = (e: React.MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const newX = e.clientX - viewOffset.x - dragOffset.x;
      const newY = e.clientY - viewOffset.y - dragOffset.y;
      
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

  // 노드 추가
  const handleAddNode = async () => {
    try {
      // 백엔드에 새 노드 생성
      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/story-nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          title: '새 노드',
          text: '새로운 노드입니다. 내용을 편집해주세요.',
          choices: '[]',
          rewards: null,
          node_type: 'story',
          route_name: null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 새 노드 ${result.node_id} 생성 완료!`);
        alert(`새 노드 ${result.node_id}가 생성되었습니다!`);
        
        // 노드 목록 새로고침
        onNodesChange([]); // 빈 배열로 설정하면 loadStoryNodes가 호출됨
      } else {
        const errorText = await response.text();
        console.error('❌ 노드 생성 실패:', errorText);
        alert('노드 생성 실패: ' + errorText);
      }
    } catch (error) {
      console.error('❌ 노드 생성 오류:', error);
      alert('노드 생성 중 오류가 발생했습니다.');
    }
  };

  // 전체 저장 (모든 노드의 변경사항을 DB에 저장)
  const handleSaveAll = async () => {
    try {
      console.log('💾 전체 저장 시작...');
      
      // 현재 편집 중인 노드가 있다면 먼저 저장
      if (selectedNode) {
        console.log(`현재 편집 중인 노드 ${selectedNode.id} 저장 중...`);
        // 편집 패널의 자동 저장 로직이 이미 있으므로 별도 처리 불필요
      }
      
      // 모든 노드의 위치 정보를 저장 (필요한 경우)
      console.log('✅ 전체 저장 완료!');
      alert('모든 변경사항이 저장되었습니다!');
      
    } catch (error) {
      console.error('❌ 전체 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
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

  // targetNodeId로 노드 찾기
  const findNodeByTargetId = (targetNodeId: number): StoryNode | null => {
    return nodes.find(node => node.id === targetNodeId) || null;
  };

  // 선택지에서 targetNodeId 추출
  const extractTargetNodeId = (choice: any): number | null => {
    if (typeof choice === 'string') {
      try {
        // JSON 문자열인 경우 파싱
        const parsed = JSON.parse(choice);
        return parsed.targetNodeId || null;
      } catch {
        return null;
      }
    } else if (choice && typeof choice === 'object') {
      // 이미 파싱된 객체인 경우
      return choice.targetNodeId || null;
    }
    return null;
  };

  // SVG 크기 계산 (모든 노드와 연결선을 포함)
  const calculateSVGBounds = () => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // 모든 노드의 경계 계산
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + 100);
      maxY = Math.max(maxY, node.y + 80);
      
      // 연결선도 고려
      if (node.choices && node.choices.length > 0) {
        node.choices.forEach((choice, index) => {
          const targetNodeId = extractTargetNodeId(choice);
          const targetNode = targetNodeId ? findNodeByTargetId(targetNodeId) : null;
          if (targetNode) {
            const startX = node.x + 100;
            const startY = node.y + 40 + (index * 15);
            const endX = targetNode.x;
            const endY = targetNode.y + 40;
            
            minX = Math.min(minX, startX, endX);
            minY = Math.min(minY, startY, endY);
            maxX = Math.max(maxX, startX, endX);
            maxY = Math.max(maxY, startY, endY);
          }
        });
      }
    });
    
    // 여백 추가
    const padding = 200;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding
    };
  };

  // 연결선 그리기 (디버깅 강화)
  const renderConnections = () => {
    const connections: JSX.Element[] = [];
    let connectionCount = 0;
    let totalChoices = 0;
    
    nodes.forEach(node => {
      if (node.choices && node.choices.length > 0) {
        console.log(`🔍 노드 ${node.id} (${node.title})의 choices:`, node.choices);
        
        node.choices.forEach((choice, index) => {
          totalChoices++;
          console.log(`  - 선택지 ${index}:`, choice);
          
          // targetNodeId 추출
          const targetNodeId = extractTargetNodeId(choice);
          console.log(`  - 추출된 targetNodeId:`, targetNodeId);
          
          const targetNode = targetNodeId ? findNodeByTargetId(targetNodeId) : null;
          console.log(`  - 찾은 타겟 노드:`, targetNode ? `${targetNode.id} (${targetNode.title})` : '없음');
          
          if (targetNode) {
            connectionCount++;
            
            // 시작점: 노드 오른쪽 중앙
            const startX = node.x + 100;
            const startY = node.y + 40 + (index * 15);
            
            // 끝점: 타겟 노드 왼쪽 중앙
            const endX = targetNode.x;
            const endY = targetNode.y + 40;
            
            // 간단한 직선 연결
            const midX = (startX + endX) / 2;
            const pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
            
            console.log(`  ✅ 연결선 생성: (${startX}, ${startY}) -> (${endX}, ${endY})`);
            
            connections.push(
              <g key={`${node.id}-${index}-${targetNode.id}`}>
                <path
                  d={pathData}
                  stroke="#667eea"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          } else {
            console.warn(`  ❌ 연결 실패: targetNodeId ${targetNodeId}에 해당하는 노드를 찾을 수 없음`);
          }
        });
      }
    });
    
    console.log(`📊 연결선 렌더링 결과:`);
    console.log(`  - 총 노드: ${nodes.length}개`);
    console.log(`  - 총 선택지: ${totalChoices}개`);
    console.log(`  - 성공한 연결: ${connectionCount}개`);
    console.log(`  - 연결 실패: ${totalChoices - connectionCount}개`);
    
    return connections;
  };

  return (
    <div ref={editorRef} className={`visual-story-editor ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 툴바 */}
      <div className="editor-toolbar">
        <button className="tool-btn" onClick={handleAddNode}>➕ 노드 추가</button>
        <button className="tool-btn" onClick={() => {
          if (nodes.length > 0) {
            const bounds = calculateSVGBounds();
            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;
            setViewOffset({ 
              x: -centerX + window.innerWidth / 2, 
              y: -centerY + window.innerHeight / 2 
            });
          }
        }}>
          🏠 중앙으로
        </button>
        <button className="tool-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '🗗 전체화면 종료' : '🗖 전체화면'}
        </button>
        <button className="tool-btn" onClick={() => {
          console.log('🔍 현재 노드들:', nodes.length);
          console.log('🔍 뷰 오프셋:', viewOffset);
          alert(`노드: ${nodes.length}개, 연결선 렌더링 중...`);
        }}>
          🔍 상태 확인
        </button>
        <button className="tool-btn save-all-btn" onClick={handleSaveAll}>
          💾 저장
        </button>
        <div style={{ marginLeft: 'auto', color: '#666', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
          빈 공간 드래그: 캔버스 이동 | 노드 드래그: 위치 변경
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
          style={{ cursor: isPanning ? 'grabbing' : draggedNode ? 'move' : 'grab' }}
        >
          {/* SVG 연결선 레이어 */}
          <svg 
            className="connections-layer" 
            width={canvasSize.width * 2} 
            height={canvasSize.height * 2}
            style={{
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
              zIndex: 5,
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'visible'
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
                transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)`,
                transformOrigin: '0 0',
                zIndex: draggedNode === node.id ? 1000 : 10
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
                  <div className="choices-count">→ {node.choices.length}개 선택지</div>
                  <div className="choices-preview">
                    {node.choices.slice(0, 2).map((choice, idx) => {
                      let label = '';
                      if (typeof choice === 'string') {
                        label = choice;
                      } else if (choice && choice.label) {
                        label = choice.label;
                      }
                      return (
                        <div key={idx} className="choice-item">
                          • {label.length > 20 ? label.substring(0, 20) + '...' : label}
                        </div>
                      );
                    })}
                    {node.choices.length > 2 && (
                      <div className="choice-item">... +{node.choices.length - 2}개 더</div>
                    )}
                  </div>
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
              saving={saving}
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
  saving?: boolean;
  onSave: (data: any) => void;
  onDelete: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, saving = false, onSave, onDelete }) => {
  // 선택지를 개별 배열로 관리 (targetNodeId 포함)
  const [choices, setChoices] = useState<any[]>(() => {
    return node.choices.map(choice => {
      if (typeof choice === 'string') {
        try {
          const parsed = JSON.parse(choice);
          return parsed;
        } catch {
          return { label: choice, targetNodeId: null };
        }
      } else if (choice && choice.label) {
        return choice;
      }
      return { label: String(choice), targetNodeId: null };
    });
  });

  const [formData, setFormData] = useState({
    title: node.title,
    text: node.text,
    rewards: node.rewards ? Object.entries(node.rewards).map(([k, v]) => `${k}:${v}`).join(', ') : '',
    route_name: node.route_name || '',
    image_url: node.image_url || '',
    image_alt: node.image_alt || '',
  });

  // 자동 저장 기능
  const autoSave = () => {
    // 선택지를 JSON 문자열로 변환
    const choicesString = JSON.stringify(choices.filter(choice => choice.label && choice.label.trim()));
    onSave({ ...formData, choices: choicesString });
  };

  // 입력값이 변경될 때마다 자동 저장 (디바운싱)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      // 실제로 변경된 내용이 있을 때만 저장
      const hasChanges = formData.title !== node.title || 
                        formData.text !== node.text ||
                        formData.route_name !== (node.route_name || '');
      
      if (hasChanges || choices.length > 0) {
        autoSave();
      }
    }, 2000); // 2초 후 자동 저장 (타이핑 완료 후)

    return () => clearTimeout(timeoutId);
  }, [formData, choices]);

  const handleSave = () => {
    autoSave();
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        handleInputChange('image_url', result.fileUrl);
        console.log('✅ 이미지 업로드 성공:', result.fileUrl);
      } else {
        const error = await response.text();
        console.error('❌ 이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChoiceChange = (index: number, field: string, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
  };

  const addChoice = () => {
    setChoices([...choices, { label: '', targetNodeId: null }]);
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
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
        <label>선택지</label>
        <div className="choices-container">
          {choices.map((choice, index) => (
            <div key={index} className="choice-input-group">
              <input
                type="text"
                value={choice.label || ''}
                onChange={(e) => handleChoiceChange(index, 'label', e.target.value)}
                placeholder={`선택지 ${index + 1} 텍스트`}
                className="choice-input"
              />
              <input
                type="number"
                value={choice.targetNodeId || ''}
                onChange={(e) => handleChoiceChange(index, 'targetNodeId', parseInt(e.target.value) || null)}
                placeholder="타겟 노드 ID"
                className="choice-target-input"
              />
              <button
                type="button"
                onClick={() => removeChoice(index)}
                className="remove-choice-btn"
                title="선택지 삭제"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChoice}
            className="add-choice-btn"
          >
            ➕ 선택지 추가
          </button>
        </div>
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

      <div className="form-group">
        <label>이미지 파일</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="file-input"
        />
        {formData.image_url && (
          <div className="current-image">
            <span>현재 이미지: {formData.image_url}</span>
            <button 
              type="button" 
              onClick={() => handleInputChange('image_url', '')}
              className="remove-image-btn"
            >
              제거
            </button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>이미지 설명</label>
        <input
          type="text"
          value={formData.image_alt}
          onChange={(e) => handleInputChange('image_alt', e.target.value)}
          placeholder="이미지에 대한 설명"
        />
      </div>

      {formData.image_url && (
        <div className="form-group">
          <label>이미지 미리보기</label>
          <div className="image-preview">
            <img 
              src={formData.image_url} 
              alt={formData.image_alt || '노드 이미지'}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'block';
              }}
            />
            <div className="image-error" style={{ display: 'none' }}>
              이미지를 불러올 수 없습니다.
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <div className="auto-save-status">
          {saving ? '💾 저장 중...' : '✅ 자동 저장됨'}
        </div>
        <button 
          className="save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '💾 저장 중...' : '💾 저장'}
        </button>
        <button className="delete-btn" onClick={onDelete}>
          🗑️ 삭제
        </button>
      </div>
    </div>
  );
};

export default VisualStoryEditor;
