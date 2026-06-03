// frontend/src/components/ChatRoomList.tsx
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

interface User {
  id: number;
  email: string;
  nickname: string;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);

  // 1. 방 목록 가져오는 함수
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log(response);
      setUsers(response.data);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>사용자 목록</h2>
      <hr />

      {/* 목록 출력 영역 */}
      {users.length === 0 ? (
        <p>사용자가 없습니다.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id} style={{ marginBottom: '10px' }}>
              {user.nickname} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;