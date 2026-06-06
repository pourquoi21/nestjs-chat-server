import type React from "react";
import { Navigate, Outlet } from "react-router-dom";


export const PrivateRoute = () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        alert('로그인이 필요한 서비스입니다.');
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}