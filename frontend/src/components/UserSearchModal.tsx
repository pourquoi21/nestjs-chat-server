import { useState } from 'react';
import api from '../api/axios';

export const UserSearchModal = ({ onInviteSubmit }) => {
    const [email, setEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [userDetail, setUserDetail] = useState<any>(null);

    // 이메일로 유저 검색
    const handleSearch = async () => {
        try {
            const response = await api.get(`users/search?email=${email}`);
            if (response.data.success) {
                setSearchResult(response.data.user);
                setUserDetail(null);
            } else {
                alert(response.data.message);
                setSearchResult(null);
            }
        } catch(error) {
            console.error('유저 검색 실패: ', error);
        }
    }

    // 유저 id로 조회
    const handleFetchDetail = async (userId: number) => {
        try {
            const response = await api.get(`users/${userId}`);
            setUserDetail(response.data);
        } catch (error) {
            console.error('특정 유저 조회 실패: ', error);
        }
    }

    return (
    <div style={{ border: '1px solid gray', padding: '20px', margin: '10px 0' }}>
      <h3>유저 검색 및 API 테스트</h3>
      <input 
        type="text" 
        placeholder="검색할 이메일 입력" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <button onClick={handleSearch}>검색</button>

      {/* 검색 결과 레이어 */}
      {searchResult && (
        <div style={styles.userCard}>
          <p><strong>닉네임:</strong> {searchResult.nickname}</p>
          <p><strong>이메일:</strong> {searchResult.email}</p>

          {/* 초대 버튼 */}
          <button
            onClick={() => onInviteSubmit([searchResult.id])}
            style={styles.inviteBtn}
          >
            초대하기
          </button>
          
          {/* 기존 users/:id API를 테스트하는 버튼 */}
          {/* <button onClick={() => handleFetchDetail(searchResult.id)}>
            기존 :id API 테스트하기 (ID: {searchResult.id})
          </button> */}
        </div>
      )}

      {/* 기존 :id 조회 결과 레이어 */}
      {/* {userDetail && (
        <div style={{ marginTop: '15px', backgroundColor: '#e2f0d9', padding: '10px' }}>
          <h4>users/:id 호출 결과 (성공)</h4>
          <pre>{JSON.stringify(userDetail, null, 2)}</pre>
        </div>
      )} */}
    </div>
    );
};

const styles = {
  userCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '15px'
  },
  inviteBtn: {
    backgroundColor: '#4CAF50', color: 'white', border: 'none', 
    padding: '8px 12px', borderRadius: '5px', cursor: 'pointer'
  }
};

