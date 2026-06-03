import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../features/auth/LoginForm';
import { login } from '../features/auth/authApi';

const LoginPage = () => {
    const navigate = useNavigate();

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
            alert('로그인 성공!');
            navigate('/chat/rooms');
        } catch (error: any) {
            alert(error.response?.data?.message || '로그인 실패');
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Grid Talk</h1>
            {/* LoginForm 부품을 가져다 쓰고, 결과 처리는 여기서! */}
            <LoginForm onLogin={handleLoginSubmit} />
        </div>
    );
};

export default LoginPage;