// frontend/src/components/ChatRoomList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface ActiveUser {
  id: number;
  email: string;
  nickname: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<ActiveUser | null>(null);
  
  // 1. 방 목록 가져오는 함수
  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      console.log(response);
      setUser(response.data);
    } catch (error) {
      console.error('정보 로드 실패:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인을 해주세요.');
      navigate('/auth/login');
      return;
    }
    fetchUser();
  }, []);

  if (!user) {
    return <div>정보를 가져오는 중...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>나의 정보</h2>

      <hr />

      {/* 출력 영역 */}
      <p>반가워, {user.nickname}! <br />
        너는 {user.id}번째 회원이고, <br />
        너의 이메일은 {user.email}이야.
      </p>
    </div>
  );
};

export default UserProfile;