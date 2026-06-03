import axios from 'axios';

let isAlertActive = false;

const api = axios.create({
    baseURL: `http://${window.location.hostname}:4000`,
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
        if (error.response && error.response.status === 401) {

            // 이미 얼럿이 떴는지 확인
            if (isAlertActive) {
                return Promise.reject(error);
            }

            isAlertActive = true;
            alert('로그인 세션이 만료되었습니다.');

            localStorage.removeItem('accessToken');
            isAlertActive = false;
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
)

export default api;