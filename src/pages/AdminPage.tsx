import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    storyNodes: 0,
    completedPlays: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 실시간 데이터 로드
  React.useEffect(() => {
    loadAdminStats();
    // 30초마다 자동 새로고침
    const interval = setInterval(loadAdminStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminStats = async () => {
    try {
      setError(null);
      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        setError('통계 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h2>대시보드</h2>
        <div className="dashboard-stats">
          <div className="stat-card loading">
            <h3>데이터 로딩 중...</h3>
            <p className="stat-number">⏳</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h2>대시보드</h2>
        <div className="dashboard-stats">
          <div className="stat-card error">
            <h3>오류 발생</h3>
            <p className="stat-number">❌</p>
            <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>
            <button onClick={loadAdminStats} style={{ marginTop: '10px', padding: '5px 10px' }}>
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>대시보드</h2>
        <button 
          onClick={loadAdminStats} 
          className="refresh-btn"
          title="새로고침"
        >
          🔄 새로고침
        </button>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>총 사용자</h3>
          <p className="stat-number">{formatNumber(stats.totalUsers)}</p>
          <p className="stat-label">등록된 사용자 수</p>
        </div>
        <div className="stat-card">
          <h3>활성 사용자</h3>
          <p className="stat-number">{formatNumber(stats.activeUsers)}</p>
          <p className="stat-label">현재 활성 사용자</p>
        </div>
        <div className="stat-card">
          <h3>스토리 노드</h3>
          <p className="stat-number">{formatNumber(stats.storyNodes)}</p>
          <p className="stat-label">총 스토리 노드 수</p>
        </div>
        <div className="stat-card">
          <h3>완료된 플레이</h3>
          <p className="stat-number">{formatNumber(stats.completedPlays)}</p>
          <p className="stat-label">완주한 플레이 수</p>
        </div>
      </div>
      <div className="dashboard-info">
        <p className="last-updated">마지막 업데이트: {new Date().toLocaleTimeString()}</p>
        <p className="auto-refresh">30초마다 자동 새로고침됩니다</p>
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

      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/import-twine', {
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
  const [saving, setSaving] = useState(false);

  // 스토리 노드 데이터 로드
  React.useEffect(() => {
    loadStoryNodes();
  }, []);

  const loadStoryNodes = async () => {
    setLoading(true);
    try {
      console.log('🔄 스토리 노드 로딩 시작...');
      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/story-nodes', {
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
            // choices는 JSON 문자열로 저장되어 있으므로 파싱
            const parsedChoices = JSON.parse(node.choices || '[]');
            // 원본 객체 그대로 사용 (targetNodeId 포함)
            choices = parsedChoices;
          } catch (e) {
            console.warn(`노드 ${node.title}의 Choices 파싱 오류:`, e);
            choices = [];
          }

          // Twine 위치 사용 (더 넓은 간격으로 조정)
          const x = node.position_x !== null && node.position_x !== undefined 
            ? node.position_x
            : 150 + (index % 3) * 350;  // 가로 간격을 220에서 350으로 증가, 4열에서 3열로 변경
          const y = node.position_y !== null && node.position_y !== undefined 
            ? node.position_y
            : 150 + Math.floor(index / 3) * 250;  // 세로 간격을 180에서 250으로 증가
          
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
    setSaving(true);
    try {
      console.log(`💾 노드 ${nodeId} 저장 중...`, nodeData);
      const response = await fetch(`https://b801-be.azurewebsites.net/api/admin/story-nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(nodeData),
      });

      if (response.ok) {
        console.log(`✅ 노드 ${nodeId} 저장 완료!`);
        // 자동 저장이므로 alert 제거
      } else {
        const errorText = await response.text();
        console.error('❌ 저장 실패:', errorText);
        alert('저장 실패: ' + errorText);
      }
    } catch (error) {
      console.error('노드 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleNodeDelete = async (nodeId: number) => {
    if (!confirm('이 노드를 정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`https://b801-be.azurewebsites.net/api/admin/story-nodes/${nodeId}`, {
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
    // 노드 목록 새로고침
    loadStoryNodes();
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
    <div className="story-editor-container">
      <VisualStoryEditor
        nodes={nodes}
        onNodeUpdate={handleNodeUpdate}
        onNodeDelete={handleNodeDelete}
        onNodesChange={handleNodesChange}
        saving={saving}
      />
    </div>
  );
};

// 노드 편집기 컴포넌트
const NodeEditor: React.FC<{
  node: any;
  onSave: (data: any) => void;
  onDelete: () => void;
}> = ({ node, onSave, onDelete }) => {
  // 선택지를 개별 배열로 관리 (targetNodeId 포함)
  const [choices, setChoices] = React.useState<any[]>(() => {
    if (node?.choices) {
      if (Array.isArray(node.choices)) {
        return node.choices;
      } else if (typeof node.choices === 'string') {
        try {
          const parsed = JSON.parse(node.choices);
          return parsed;
        } catch {
          // 파싱 실패 시 빈 문자열들을 객체로 변환
          return node.choices.split('|').filter((c: string) => c.trim()).map((choice: string) => ({
            label: choice,
            targetNodeId: null
          }));
        }
      }
    }
    return [];
  });

  const [formData, setFormData] = React.useState({
    title: node?.title || '',
    text: node?.content || '',
    rewards: node?.rewards ? Object.entries(node.rewards).map(([k, v]) => `${k}:${v}`).join(', ') : '',
    route_name: node?.route_name || '',
  });

  const handleSave = () => {
    // 선택지를 JSON 문자열로 변환
    const choicesString = JSON.stringify(choices.filter(choice => choice.label && choice.label.trim()));
    onSave({ ...formData, choices: choicesString });
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
        <label>선택지:</label>
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
                onChange={(e) => handleChoiceChange(index, 'targetNodeId', e.target.value)}
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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddAbilityModal, setShowAddAbilityModal] = useState(false);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [allAbilities, setAllAbilities] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchResources();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://b801-be.azurewebsites.net/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('유저 목록 조회 실패:', error);
      alert('유저 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      // 아이템 목록
      const itemsResponse = await fetch('https://b801-be.azurewebsites.net/api/admin/resources?type=ITEM', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const itemsData = await itemsResponse.json();
      setAllItems(itemsData.resources || []);

      // 능력 목록
      const abilitiesResponse = await fetch('https://b801-be.azurewebsites.net/api/admin/resources?type=SKILL', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const abilitiesData = await abilitiesResponse.json();
      setAllAbilities(abilitiesData.resources || []);
    } catch (error) {
      console.error('리소스 목록 조회 실패:', error);
    }
  };

  const handleSelectUser = async (user: any) => {
    try {
      const response = await fetch(`https://b801-be.azurewebsites.net/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const data = await response.json();
      setSelectedUser(data.user);
      setEditingUser({ ...data.user });
    } catch (error) {
      console.error('유저 상세 조회 실패:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      // 기본 정보 업데이트
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hp: editingUser.hp,
          energy: editingUser.energy,
          gold: editingUser.gold,
          attack_power: editingUser.attack_power,
          current_day: editingUser.current_day,
          is_alive: editingUser.is_alive
        })
      });

      // 조사 기회 업데이트
      if (editingUser.daily_investigation_count?.[0]) {
        await fetch(`https://b801-be.azurewebsites.net/api/admin/users/${editingUser.id}/investigation-count`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            day: editingUser.current_day || 1,
            count: editingUser.daily_investigation_count[0].count
          })
        });
      }

      alert('유저 정보가 수정되었습니다.');
      fetchUsers();
      handleSelectUser(editingUser);
    } catch (error) {
      console.error('유저 정보 수정 실패:', error);
      alert('유저 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteItem = async (resourceId: number) => {
    if (!confirm('이 아이템을 삭제하시겠습니까?')) return;
    
    try {
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      alert('아이템이 삭제되었습니다.');
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('아이템 삭제 실패:', error);
      alert('아이템 삭제에 실패했습니다.');
    }
  };

  const handleDeleteAbility = async (resourceId: number) => {
    if (!confirm('이 능력을 삭제하시겠습니까?')) return;
    
    try {
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      alert('능력이 삭제되었습니다.');
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('능력 삭제 실패:', error);
      alert('능력 삭제에 실패했습니다.');
    }
  };

  const handleDeleteCheckpoint = async (checkpointId: number) => {
    if (!confirm('이 체크포인트를 삭제하시겠습니까?')) return;
    
    try {
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/checkpoints/${checkpointId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      alert('체크포인트가 삭제되었습니다.');
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('체크포인트 삭제 실패:', error);
      alert('체크포인트 삭제에 실패했습니다.');
    }
  };

  const handleAddItem = async (resourceId: number) => {
    if (!selectedUser) return;
    
    try {
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/${selectedUser.id}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_id: resourceId,
          quantity: 1
        })
      });
      alert('아이템이 추가되었습니다.');
      setShowAddItemModal(false);
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('아이템 추가 실패:', error);
      alert('아이템 추가에 실패했습니다.');
    }
  };

  const handleAddAbility = async (resourceId: number) => {
    if (!selectedUser) return;
    
    try {
      await fetch(`https://b801-be.azurewebsites.net/api/admin/users/${selectedUser.id}/abilities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_id: resourceId,
          quantity: 1
        })
      });
      alert('능력이 추가되었습니다.');
      setShowAddAbilityModal(false);
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error('능력 추가 실패:', error);
      alert('능력 추가에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-list-section">
        <h2>👥 사용자 목록 ({users.length}명)</h2>
        <div className="user-list">
          {users.map((user) => (
            <div
              key={user.id}
              className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
              onClick={() => handleSelectUser(user)}
            >
              <div className="user-card-header">
                <h3>{user.username}</h3>
                <span className={`status-badge ${user.is_alive ? 'alive' : 'dead'}`}>
                  {user.is_alive ? '생존' : '사망'}
                </span>
              </div>
              <div className="user-card-stats">
                <div className="stat-item">
                  <span className="stat-label">❤️ HP</span>
                  <span className="stat-value">{user.hp}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">⚡ Energy</span>
                  <span className="stat-value">{user.energy}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">💰 Gold</span>
                  <span className="stat-value">{user.gold}</span>
                </div>
              </div>
              <div className="user-card-investigation">
                <span>📍 Day {user.current_day}</span>
                <span>
                  🔍 조사: {3 - (user.daily_investigation_count[0]?.count || 0)}/3
                </span>
              </div>
              <div className="user-card-checkpoints">
                <span>💾 체크포인트: {user.user_checkpoints.length}개</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && (
        <div className="user-detail-section">
          <div className="detail-header">
            <h2>📋 {selectedUser.username} 상세 정보</h2>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>✕</button>
          </div>

          {/* 기본 정보 수정 */}
          <div className="detail-card">
            <h3>⚙️ 기본 정보 수정</h3>
            <div className="edit-form">
              <div className="form-row">
                <label>HP</label>
                <input
                  type="number"
                  value={editingUser?.hp || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, hp: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Energy</label>
                <input
                  type="number"
                  value={editingUser?.energy || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, energy: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Gold</label>
                <input
                  type="number"
                  value={editingUser?.gold || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, gold: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>공격력</label>
                <input
                  type="number"
                  value={editingUser?.attack_power || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, attack_power: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>Day</label>
                <input
                  type="number"
                  value={editingUser?.current_day || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, current_day: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-row">
                <label>조사 사용 횟수 (Day {editingUser?.current_day || 1})</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={editingUser?.daily_investigation_count?.[0]?.count || 0}
                  onChange={(e) => {
                    const newCount = Math.max(0, Math.min(3, parseInt(e.target.value) || 0));
                    setEditingUser({ 
                      ...editingUser, 
                      daily_investigation_count: [{ 
                        ...editingUser?.daily_investigation_count?.[0],
                        count: newCount,
                        day: editingUser?.current_day || 1
                      }]
                    });
                  }}
                />
                <small style={{color: '#9a9a9a', marginTop: '4px'}}>남은 기회: {3 - (editingUser?.daily_investigation_count?.[0]?.count || 0)}</small>
              </div>
              <div className="form-row">
                <label>생존 여부</label>
                <select
                  value={editingUser?.is_alive ? 'true' : 'false'}
                  onChange={(e) => setEditingUser({ ...editingUser, is_alive: e.target.value === 'true' })}
                >
                  <option value="true">생존</option>
                  <option value="false">사망</option>
                </select>
              </div>
              <button className="save-btn" onClick={handleUpdateUser}>💾 저장</button>
            </div>
          </div>

          {/* 스토리 아이템 */}
          <div className="detail-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{margin: 0}}>🎒 스토리 아이템 ({selectedUser.user_story_items?.length || 0}개)</h3>
              <button className="add-btn" onClick={() => setShowAddItemModal(true)}>➕ 추가</button>
            </div>
            <div className="inventory-list">
              {selectedUser.user_story_items?.map((item: any) => (
                <div key={item.id} className="inventory-item">
                  <div>
                    <strong>{item.story_item.name}</strong>
                    <span className="quantity">x{item.quantity}</span>
                    <p className="description">{item.story_item.description}</p>
                  </div>
                  <button className="delete-btn-small" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                </div>
              ))}
              {(!selectedUser.user_story_items || selectedUser.user_story_items.length === 0) && (
                <p className="empty-message">보유한 아이템이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 스토리 능력 */}
          <div className="detail-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{margin: 0}}>✨ 스토리 능력 ({selectedUser.user_story_abilities?.length || 0}개)</h3>
              <button className="add-btn" onClick={() => setShowAddAbilityModal(true)}>➕ 추가</button>
            </div>
            <div className="ability-list">
              {selectedUser.user_story_abilities?.map((ability: any) => (
                <div key={ability.id} className="ability-item">
                  <div>
                    <strong>{ability.story_ability.name}</strong>
                    <span className="level">Lv.{ability.quantity}</span>
                    <p className="description">{ability.story_ability.description}</p>
                  </div>
                  <button className="delete-btn-small" onClick={() => handleDeleteAbility(ability.id)}>🗑️</button>
                </div>
              ))}
              {(!selectedUser.user_story_abilities || selectedUser.user_story_abilities.length === 0) && (
                <p className="empty-message">보유한 능력이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 체크포인트 */}
          <div className="detail-card">
            <h3>💾 체크포인트 ({selectedUser.user_checkpoints?.length || 0}개)</h3>
            <div className="checkpoint-list">
              {selectedUser.user_checkpoints?.map((checkpoint: any) => (
                <div key={checkpoint.id} className="checkpoint-item">
                  <div>
                    <strong>{checkpoint.title}</strong>
                    <span className="node-id">Node #{checkpoint.node_id}</span>
                    <p className="description" style={{margin: '4px 0', fontSize: '0.85rem', color: '#9a9a9a'}}>
                      체크포인트는 노드 위치만 저장됩니다. 로드 시 현재 상태(HP/에너지/골드/아이템/능력)를 유지합니다.
                    </p>
                    <span className="saved-at">{new Date(checkpoint.saved_at).toLocaleString()}</span>
                  </div>
                  <button className="delete-btn-small" onClick={() => handleDeleteCheckpoint(checkpoint.id)}>🗑️</button>
                </div>
              ))}
              {(!selectedUser.user_checkpoints || selectedUser.user_checkpoints.length === 0) && (
                <p className="empty-message">저장된 체크포인트가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 아이템 추가 모달 */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🎒 아이템 추가</h3>
            <div className="resource-list">
              {allItems.map((item: any) => (
                <div
                  key={item.id}
                  className="resource-item"
                  onClick={() => handleAddItem(item.id)}
                >
                  <strong>{item.name}</strong>
                  <p className="description">{item.description}</p>
                </div>
              ))}
            </div>
            <button className="close-modal-btn" onClick={() => setShowAddItemModal(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* 능력 추가 모달 */}
      {showAddAbilityModal && (
        <div className="modal-overlay" onClick={() => setShowAddAbilityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>✨ 능력 추가</h3>
            <div className="resource-list">
              {allAbilities.map((ability: any) => (
                <div
                  key={ability.id}
                  className="resource-item"
                  onClick={() => handleAddAbility(ability.id)}
                >
                  <strong>{ability.name}</strong>
                  <p className="description">{ability.description}</p>
                </div>
              ))}
            </div>
            <button className="close-modal-btn" onClick={() => setShowAddAbilityModal(false)}>닫기</button>
          </div>
        </div>
      )}
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
