import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login');

        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                if (isLoginRequest) {
                    return Promise.reject(error);
                }

                localStorage.removeItem('accessToken');
                
                window.location.href = '/login';
                return new Promise(() => {});
            }
        }
        return Promise.reject(error);
    }
)

export default api;