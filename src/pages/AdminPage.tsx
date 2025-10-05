import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminPage.css';
import { useAuthStore } from '@/store/authStore';
import VisualStoryEditor from '@/components/StoryEditor/VisualStoryEditor';

// 관리자 페이지 메인 컴포넌트
const AdminPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearAuth, user } = useAuthStore();
  
  const menuItems = [
    { path: '/admin', label: '대시보드', icon: '📊' },
    { path: '/admin/story-editor', label: '스토리 편집기', icon: '📝' },
    { path: '/admin/users', label: '사용자 관리', icon: '👥' },
    { path: '/admin/analytics', label: '분석', icon: '📈' },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>🎮 B801 관리자</h2>
        </div>
        <nav className="admin-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header">
          <h1>관리자 패널</h1>
          <div className="admin-user-info">
            <span>{user?.username || '관리자'}</span>
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </div>
        </header>
        
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/story-editor" element={<StoryEditor />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// 대시보드 컴포넌트
const AdminDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h2>대시보드</h2>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>총 사용자</h3>
          <p className="stat-number">1,234</p>
        </div>
        <div className="stat-card">
          <h3>활성 사용자</h3>
          <p className="stat-number">456</p>
        </div>
        <div className="stat-card">
          <h3>스토리 노드</h3>
          <p className="stat-number">148</p>
        </div>
        <div className="stat-card">
          <h3>완료된 플레이</h3>
          <p className="stat-number">89</p>
        </div>
      </div>
    </div>
  );
};

// 스토리 편집기 컴포넌트
const StoryEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'import' | 'preview'>('visual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0); // 편집기 새로고침용

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setImportStatus('파일 업로드 중...');

    try {
      const formData = new FormData();
      formData.append('twineFile', file);

      const response = await fetch('http://localhost:5000/api/admin/import-twine', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setImportStatus(`✅ Twine 파일이 성공적으로 임포트되었습니다! (${result.stats.totalNodes}개 노드)`);
        // 스토리 편집기 새로고침
        setRefreshKey(prev => prev + 1);
        // 자동으로 시각적 편집 탭으로 이동
        setTimeout(() => setActiveTab('visual'), 1000);
      } else {
        setImportStatus('❌ 임포트 실패: ' + await response.text());
      }
    } catch (error) {
      setImportStatus('❌ 업로드 오류: ' + error);
    }
  };

  return (
    <div className="story-editor">
      <div className="editor-header">
        <h2>스토리 편집기</h2>
        <div className="editor-tabs">
          <button 
            className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            📝 시각적 편집
          </button>
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >

            📁 Twine 임포트
          </button>
          <button 
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ 미리보기
          </button>
        </div>
      </div>

      <div className="editor-content">
        {activeTab === 'visual' && <VisualStoryEditorWrapper key={refreshKey} />}
        {activeTab === 'import' && (
          <div className="import-panel">
            <h3>Twine 파일 임포트</h3>
            <div className="upload-area">
              <input
                type="file"
                accept=".twine,.twee,.txt"
                onChange={handleFileUpload}
                id="twine-file-input"
                className="file-input"
              />
              <label htmlFor="twine-file-input" className="upload-label">
                <div className="upload-icon">📁</div>
                <p>Twine 파일을 드래그하거나 클릭하여 업로드</p>
                <p className="upload-hint">.twine, .twee 또는 .txt 파일 지원</p>
              </label>
            </div>
            
            
            {importStatus && (
              <div className="import-status">
                {importStatus}
              </div>
            )}

            <div className="import-info">
              <h4>임포트 가이드</h4>
              <ul>
                <li>Twine에서 Export to File을 통해 .twine 파일 생성</li>
                <li>또는 Export to Text를 통해 .twee 파일 생성</li>
                <li>또는 일반 텍스트 파일(.txt)로 저장</li>
                <li>파일 업로드 시 자동으로 노드와 연결이 파싱됩니다</li>
                <li>기존 스토리는 백업 후 덮어씌워집니다</li>
              </ul>
            </div>
          </div>
        )}
        {activeTab === 'preview' && <StoryPreview />}
      </div>
    </div>
  );
};

// 시각적 스토리 편집기 컴포넌트
const VisualStoryEditorWrapper: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 스토리 노드 데이터 로드
  React.useEffect(() => {
    loadStoryNodes();
  }, []);

  const loadStoryNodes = async () => {
    setLoading(true);
    try {
      console.log('🔄 스토리 노드 로딩 시작...');
      const response = await fetch('http://localhost:5000/api/admin/story-nodes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 받은 데이터:', data);
        console.log('📊 노드 개수:', data.nodes?.length || 0);
        
        if (!data.nodes || data.nodes.length === 0) {
          console.warn('⚠️ 노드가 없습니다!');
          setNodes([]);
          setLoading(false);
          return;
        }

        // 노드 데이터를 시각적 편집기에 맞게 변환
        const visualNodes = data.nodes.map((node: any, index: number) => {
          // 디버깅: 첫 3개 노드의 위치 정보 출력
          if (index < 3) {
            console.log(`노드 ${index} (${node.title}):`, {
              position_x: node.position_x,
              position_y: node.position_y,
              type: typeof node.position_x
            });
          }
          
          let choices = [];
          try {
            choices = JSON.parse(node.choices || '[]');
            // choices는 이미 객체 배열 형태로 파싱되어 있음 (targetNodeId 포함)
          } catch (e) {
            console.warn('Choices 파싱 오류:', e);
            choices = [];
          }

          // Twine 위치 사용 (스케일 조정 없이 그대로)
          const x = node.position_x !== null && node.position_x !== undefined 
            ? node.position_x
            : 100 + (index % 4) * 220;
          const y = node.position_y !== null && node.position_y !== undefined 
            ? node.position_y
            : 100 + Math.floor(index / 4) * 180;
          
          // 디버깅: 계산된 위치 출력
          if (index < 3) {
            console.log(`  -> 계산된 위치: x=${x}, y=${y}`);
          }

          return {
            id: node.node_id,
            title: node.title,
            text: node.text,
            x: x,
            y: y,
            choices: choices,  // targetNodeId 포함된 객체 배열
            rewards: node.rewards ? JSON.parse(node.rewards) : null,
            route_name: node.route_name,
            node_type: node.node_type
          };
        });
        
        console.log('✅ 변환된 노드:', visualNodes.length);
        setNodes(visualNodes);
      } else {
        console.error('❌ API 응답 실패:', response.status);
      }
    } catch (error) {
      console.error('❌ 스토리 노드 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeUpdate = async (nodeId: number, nodeData: any) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/story-nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(nodeData),
      });

      if (response.ok) {
        loadStoryNodes();
        alert('노드가 성공적으로 저장되었습니다!');
      } else {
        alert('저장 실패: ' + await response.text());
      }
    } catch (error) {
      console.error('노드 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleNodeDelete = async (nodeId: number) => {
    if (!confirm('이 노드를 정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/story-nodes/${nodeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        loadStoryNodes();
        alert('노드가 성공적으로 삭제되었습니다!');
      } else {
        alert('삭제 실패: ' + await response.text());
      }
    } catch (error) {
      console.error('노드 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleNodesChange = (newNodes: any[]) => {
    setNodes(newNodes);
  };

  if (loading) {
    return (
      <div className="visual-editor">
        <div className="loading">⏳ 스토리 노드를 불러오는 중...</div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="visual-editor" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>📭 스토리 노드가 없습니다</h3>
          <p style={{ color: '#666' }}>Twine 임포트 탭에서 파일을 업로드하여 스토리를 생성하세요</p>
        </div>
      </div>
    );
  }

  return (
    <VisualStoryEditor
      nodes={nodes}
      onNodeUpdate={handleNodeUpdate}
      onNodeDelete={handleNodeDelete}
      onNodesChange={handleNodesChange}
    />
  );
};

// 노드 편집기 컴포넌트
const NodeEditor: React.FC<{
  node: any;
  onSave: (data: any) => void;
  onDelete: () => void;
}> = ({ node, onSave, onDelete }) => {
  const [formData, setFormData] = React.useState({
    title: node?.title || '',
    text: node?.content || '',
    choices: node?.choices ? node.choices.join('|') : '',
    rewards: node?.rewards ? Object.entries(node.rewards).map(([k, v]) => `${k}:${v}`).join(', ') : '',
    route_name: node?.route_name || '',
  });

  const handleSave = () => {
    onSave(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="node-editor">
      <h4>노드 편집 - {node?.title}</h4>
      <div className="editor-form">
        <label>
          제목:
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </label>
        <label>
          내용:
          <textarea 
            value={formData.text}
            onChange={(e) => handleInputChange('text', e.target.value)}
            rows={4}
          />
        </label>
        <label>
          선택지 (|로 구분):
          <textarea 
            value={formData.choices}
            onChange={(e) => handleInputChange('choices', e.target.value)}
            placeholder="선택지 1|선택지 2|선택지 3"
            rows={2}
          />
        </label>
        <label>
          보상 (키:값,키:값 형태):
          <input 
            type="text" 
            value={formData.rewards}
            onChange={(e) => handleInputChange('rewards', e.target.value)}
            placeholder="골드:100, 에너지:50"
          />
        </label>
        <label>
          루트 이름:
          <input 
            type="text" 
            value={formData.route_name}
            onChange={(e) => handleInputChange('route_name', e.target.value)}
            placeholder="루트 1, 루트 2 등"
          />
        </label>
        <div className="editor-buttons">
          <button className="save-btn" onClick={handleSave}>💾 저장</button>
          <button className="delete-btn" onClick={onDelete}>🗑️ 삭제</button>
        </div>
      </div>
    </div>
  );
};

// 스토리 미리보기 컴포넌트
const StoryPreview: React.FC = () => {
  return (
    <div className="story-preview">
      <h3>플레이어 뷰 미리보기</h3>
      <div className="preview-content">
        <p>여기에 실제 게임 화면과 동일한 스토리 미리보기가 표시됩니다.</p>
        <div className="preview-story">
          <h4>시작</h4>
          <p>스토리가 시작됩니다...</p>
          <div className="preview-choices">
            <button className="choice-btn">선택지 1</button>
            <button className="choice-btn">선택지 2</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 사용자 관리 컴포넌트
const UserManagement: React.FC = () => {
  return (
    <div className="user-management">
      <h2>사용자 관리</h2>
      <p>사용자 목록과 관리 기능이 여기에 표시됩니다.</p>
    </div>
  );
};

// 분석 컴포넌트
const Analytics: React.FC = () => {
  return (
    <div className="analytics">
      <h2>분석</h2>
      <p>게임 통계와 분석 데이터가 여기에 표시됩니다.</p>
    </div>
  );
};

export default AdminPage;
