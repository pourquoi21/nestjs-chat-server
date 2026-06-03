import React from 'react';

export interface ActiveUser {
  id: number;
  email: string;
  nickname: string;
}

interface UserProfileProps {
  user: ActiveUser;
}

const UserProfile = ({ user }: UserProfileProps) => {
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>유저 정보</h2>

      <hr />

      <p><strong>{user.nickname}</strong></p>
      <p>{user.id}번째 회원</p>
      <p>이메일은 {user.email}</p>
    </div>
  );
};

export default UserProfile;