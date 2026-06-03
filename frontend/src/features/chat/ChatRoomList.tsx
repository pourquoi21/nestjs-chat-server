// frontend/src/components/ChatRoomList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface ChatRoom {
  id: string;
  title: string;
}

const ChatRoomList = () => {
  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  const [otherRooms, setOtherRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  // 참여한 방 목록 가져오는 함수
  const fetchMyRooms = async () => {
    try {
      const response = await api.get('/chat/rooms');
      console.log(response);
      setMyRooms(response.data);
    } catch (error) {
      console.error('방 목록 로드 실패:', error);
    }
  };

  // 참여하지 않은 방 목록 가져오는 함수
  const fetchOtherRooms = async () => {
    try {
      const response = await api.get('/chat/rooms/unjoined');
      console.log(response);
      setOtherRooms(response.data);
    } catch (error) {
      console.error('참여하지않은 방 목록 로그 실패:', error);
    }
  }

  useEffect(() => {
    // 토큰이 아예 없을 경우
    if (!localStorage.getItem('accessToken')) {
      alert('로그인이 필요한 서비스입니다.');
      window.location.href = '/login';
      return;
    }

    const fetchAllRooms = async () => {
      // await fetchMyRooms();
      // await fetchOtherRooms();
      try {
        const [myRoomsRes, otherRoomsRes] = await Promise.all([
          api.get('/chat/rooms'),
          api.get('/chat/rooms/unjoined')
        ]);

        setMyRooms(myRoomsRes.data);
        setOtherRooms(otherRoomsRes.data);
      } catch (error) {
        console.error('방 목록 로드 실패:', error);
      }
    };
    fetchAllRooms();
  }, []);

  // 새 방 만드는 함수
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return alert('방 이름을 입력해주세요.');
    try {
      // 백엔드에 방 생성 API가 있다고 가정 (예: POST /chat)
      await api.post('/chat/rooms', { title: newRoomName, invitedUserIds: [] }); 
      setNewRoomName('');
      fetchMyRooms(); // 목록 새로고침
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

  return (
    <div style={{ padding: '20px' }}>
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