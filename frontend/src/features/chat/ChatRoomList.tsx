// frontend/src/components/ChatRoomList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { UserSearchModal } from '../../components/UserSearchModal';

interface ChatRoom {
  id: string;
  title: string;
}

const ChatRoomList = () => {
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [otherRooms, setOtherRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  // 방 목록 가져오는 함수
  const fetchAllRooms = async () => {
    try {
      const [myRoomsRes, otherRoomsRes] = await Promise.all([
        api.get('/chat/rooms'),
        api.get('/chat/rooms/unjoined')
      ]);

      setMyRooms(myRoomsRes.data);
      setOtherRooms(otherRoomsRes.data);
    } catch (error: any) {
      console.error('방 목록 로드 실패:', error);

    }
  };

  // 새 방 만드는 함수
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return alert('방 이름을 입력해주세요.');
    try {
      await api.post('/chat/rooms', { title: newRoomName, invitedUserIds: [] }); 
      setNewRoomName('');
      // fetchMyRooms();
      await fetchAllRooms();
      alert('방 생성 완료!');
    } catch (error) {
      alert('방 생성 실패!');
    }
  };

  // 방 입장 함수
  const handleJoinRoom = async (roomId: string) => {
    try {
      await api.post(`/chat/rooms/${roomId}/join`);
      navigate(`/chat/rooms/${roomId}`);
    } catch (error) {
      console.error('방 입장 실패: ', error);
      alert('방 입장 실패');
    }
  }

  useEffect(() => {
    fetchAllRooms();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <UserSearchModal />
      <h2>나의 채팅방 목록</h2>
      
      {/* 방 만들기 영역 */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          value={newRoomName} 
          onChange={(e) => setNewRoomName(e.target.value)} 
          placeholder="방 제목을 입력해주세요." 
        />
        <button onClick={handleCreateRoom}>방 만들기</button>
      </div>

      <hr />

      {/* 참여중인 방 목록 출력 영역 */}
      {myRooms.length === 0 ? (
        <p>참여 중인 방이 없어. 방을 새로 만들어봐!</p>
      ) : (
        <ul>
          {myRooms.map((room) => (
            <li key={room.id} style={{ marginBottom: '10px' }}>
              <strong>{room.title}</strong> 
              <button
                style={{ marginLeft: '10px' }}
                onClick={() => handleJoinRoom(room.id)}
                >
                  입장하기</button>
            </li>
          ))}
        </ul>
      )}
      
      <hr />

      <h2>참여할 수 있는 방</h2>

      <hr />

      {/* 목록 출력 영역 */}
      {otherRooms.length === 0 ? (
        <p>다른 방이 존재하지 않습니다.</p>
      ) : (
        <ul>
          {otherRooms.map((room) => (
            <li key={room.id} style={{ marginBottom: '10px' }}>
              <strong>{room.title}</strong> 
              <button
                style={{ marginLeft: '10px' }}
                onClick={() => handleJoinRoom(room.id)}
                >
                  입장하기</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatRoomList;