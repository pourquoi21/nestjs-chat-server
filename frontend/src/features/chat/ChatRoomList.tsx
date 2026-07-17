// frontend/src/components/ChatRoomList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import api from '../../api/axios';

interface ChatRoom {
  id: string;
  title: string;
  unread_count: number;
  last_message: string;
}

const ChatRoomList = () => {
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  // 방 목록 가져오는 함수
  const fetchAllRooms = async () => {
    try {
      const res = await api.get('/chat/rooms');
      setMyRooms(res.data);
      console.log(res.data);
    } catch (error: any) {
      console.error('방 목록 로드 실패:', error);
    }
  };

  // 새 방 만드는 함수
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return alert('방 이름을 입력해주세요.');
    try {
      await api.post('/chat/rooms', { title: newRoomName }); 
      setNewRoomName('');
      await fetchAllRooms();
      alert('방 생성 완료!');
    } catch (error) {
      alert('방 생성 실패!');
    }
  };

  // 방 입장 함수
  const handleJoinRoom = async (roomId: string, title: string) => {
    try {
      navigate(`/chat/rooms/${roomId}`, {state: { title }});
    } catch (error) {
      console.error('방 입장 실패: ', error);
      alert('방 입장 실패');
    }
  }

  useEffect(() => {
    fetchAllRooms();
  }, []);

  return (
    <div>
      <Header />
      <h2 style={styles.title}>나의 채팅방 목록</h2>
      
      {/* 방 만들기 영역 */}
      <div style={styles.createForm}>
        <input 
          style={styles.input}
          value={newRoomName} 
          onChange={(e) => setNewRoomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
          placeholder="방 제목을 입력해주세요." 
        />
        <button
          style={styles.createButton}
          onClick={handleCreateRoom}>방 만들기</button>
      </div>

      <hr />

      {/* 참여중인 방 목록 출력 영역 */}
      {myRooms.length === 0 ? (
      <p style={styles.emptyText}>참여 중인 방이 없습니다. 새로운 방을 만들어보세요.</p>
    ) : (
      <ul style={styles.roomList}>
        {myRooms.map((room) => {
          // const unreadCount = room.last_message_id - room.last_read_message_id;
          const unreadCount = room.unread_count;

          // 방 타이틀에서 앞 두 글자만 따서 원형아바타로 활용
          const avatarText = room.title ? room.title.slice(0, 2) : '방';

          return (
            <li 
              key={room.id} 
              style={styles.roomItem}
              onClick={() => handleJoinRoom(room.id, room.title)}
            >
              {/* 원형아바타와 텍스트 정보 묶음 */}
              <div style={styles.leftContainer}>
                {/* 원형아바타 */}
                <div style={styles.avatar}>
                  {avatarText}
                </div>
                
                {/* 방 이름 & 마지막 메시지 세로 정렬 */}
                <div style={styles.textContainer}>
                  <strong style={styles.roomTitle}>{room.title}</strong>
                  <span style={styles.lastMessage}>
                    {room.last_message || '아직 대화가 없습니다.'}
                  </span>
                </div>
              </div>

              {/* 안 읽은 메시지 뱃지 */}
              {unreadCount > 0 && (
                <div style={styles.badge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  title: {
  textAlign: 'center',
  margin: '2rem 0 1rem',
  fontSize: '20px',
  fontWeight: 500,
  color: '#1A1A1A',
  },
  createForm: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  input: {
    flex: 1,
    maxWidth: '260px',
    padding: '8px 12px',
    border: '1px solid #D1D1D1',
    borderRadius: '6px',
    fontSize: '14px',
  },
  createButton: {
    background: '#3B79C4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  roomList: {
    listStyle: 'none',
    padding: 0,
    margin: '20px auto',
    width: '90%',
    maxWidth: '1000px', 
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 8px',
    borderBottom: '1px solid #EAEAEA',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
 
  leftContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#D1E4F9',
    color: '#3B79C4',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'left',
  },
  roomTitle: {
    fontSize: '16px',
    color: '#1A1A1A',
    fontWeight: 600,
  },
  lastMessage: {
    fontSize: '13px',
    color: '#757575', 
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '240px',
  },
  badge: {
    minWidth: '25px',
    height: '25px',
    padding: '0 6px',
    borderRadius: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#E24B4A',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  emptyText: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px 0',
  },
};

export default ChatRoomList;