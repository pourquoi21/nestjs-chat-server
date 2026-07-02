import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

interface AuthContextType {
    currentUser: { id: number; nickname: string } | null;
    isLoading: boolean;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, isLoading: true });

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<AuthContextType['currentUser']>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            api.get('/users/me').then((res) => setCurrentUser({
                id: res.data.id,
                nickname: res.data.nickname,
            }))
            .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);