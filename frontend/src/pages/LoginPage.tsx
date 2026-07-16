import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';
import { login } from '../features/auth/authApi';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';


const LoginPage = () => {
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            navigate('/chat/rooms', { replace: true });
        }
    }, [navigate]);

    const handleLoginSubmit = async (email: string, password: any) => {
        try {
            const data = await login({ email, password });
            localStorage.setItem('accessToken', data.access_token);
            const meRes = await api.get('/users/me');
            setCurrentUser({ id: meRes.data.id, nickname: meRes.data.nickname });
            alert('로그인 성공!');
            navigate('/chat/rooms');
        } catch (error: any) {
            alert(error.response?.data?.message || '로그인 실패');
        }
    };

    return (
        <div style={styles.page}>
            <h1 style={styles.brand}>Grid Talk</h1>
            <LoginForm onLogin={handleLoginSubmit} />
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: '360px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' },
  brand: { fontSize: '22px', fontWeight: 500, color: '#1A1A1A', margin: '0 0 2.5rem' },
};

export default LoginPage;