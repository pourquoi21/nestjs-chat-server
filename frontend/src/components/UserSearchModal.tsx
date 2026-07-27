import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { ActiveUser as User } from '../features/users/UserProfile';

interface UserSearchModalProps {
  onInviteSubmit: (userIds: number[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const UserSearchModal = ({ onInviteSubmit, isOpen, onClose }: UserSearchModalProps) => {
    if (!isOpen) return null;
  
    const [email, setEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const { currentUser } = useAuth();
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    // 검색결과에서 유저를 클릭시 selectedUsers에 추가
    const handleSelectUser = (user: User) => {
      if (user.id === currentUser!.id) return;
      if (selectedUsers.some((u) => u.id === user.id)) return;
      setSelectedUsers((prev) => [ ...prev, user ]);
      console.log(selectedUsers);
    };

    // 이메일로 유저 검색
    const handleSearch = async () => {
        try {
            const response = await api.get(`users/search?email=${email}`);
            if (response.data.success) {
                setSearchResult(response.data.user);
            } else {
                alert(response.data.message);
                setSearchResult(null);
            }
        } catch(error) {
            console.error('유저 검색 실패: ', error);
        }
    }

    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h3 style={styles.title}>유저 검색</h3>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>

          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="이메일로 검색"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={styles.input}
            />
            <button onClick={handleSearch} style={styles.searchBtn}>검색</button>
          </div>

          {searchResult && (
            
            <div style={styles.userCard}>
              <div
                onClick={() => handleSelectUser(searchResult)}
                style={styles.userInfo}>
                <p style={styles.nickname}>{searchResult.nickname}</p>
                <p style={styles.email}>{searchResult.email}</p>
              </div>
              {searchResult.id !== currentUser?.id && (
                <button
                onClick={() => onInviteSubmit([searchResult.id])}
                style={styles.inviteBtn}
                >
                  초대하기
                </button>
              )}
              {}
              
            </div>
          )}
        </div>
      </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
  // 모달 바깥 어두운 배경
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  // 모달 컨테이너
  container: {
    backgroundColor: '#fff', padding: '24px', borderRadius: '12px',
    minWidth: '360px', maxWidth: '480px', width: '90%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
  },
  // 모달 헤더 (제목 + 닫기버튼)
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0, fontSize: '16px', fontWeight: 600
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '18px', color: '#888', lineHeight: 1
  },
  // 검색 입력 영역
  searchRow: {
    display: 'flex', gap: '8px', marginBottom: '12px'
  },
  input: {
    flex: 1, padding: '8px 12px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px', outline: 'none'
  },
  searchBtn: {
    padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px'
  },
  // 검색 결과 카드
  userCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px', border: '1px solid #eee', borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  userInfo: {
    display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start'
  },
  nickname: {
    fontSize: '14px', fontWeight: 600, margin: 0
  },
  email: {
    fontSize: '12px', color: '#888', margin: 0
  },
  inviteBtn: {
    padding: '8px 14px', backgroundColor: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
    whiteSpace: 'nowrap'
  },
};

