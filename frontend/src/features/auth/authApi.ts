import api from '../../api/axios';

export const login = async (credentials: {email: string; password: any}) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
}