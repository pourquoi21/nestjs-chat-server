import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import UserProfile, { type ActiveUser } from '../features/users/UserProfile';

const MyProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<ActiveUser | null>(null);
  
  // 유저 정보를 가져옴
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
      navigate('/login');
      return;
    }
    fetchUser();
  }, [navigate]);
  
  if (!user) {
    return <div>정보를 가져오는 중...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>유저 정보</h2>

      <hr />

      {/* 출력 영역 */}
      <UserProfile user={user} />
    </div>
  );
};

export default MyProfilePage;