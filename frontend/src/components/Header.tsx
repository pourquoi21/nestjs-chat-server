import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Header = () => {
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    const handleLogout = () => {
        const confirmLogout = confirm('로그아웃하시겠습니까?');
        if (confirmLogout) {
          localStorage.removeItem('accessToken');
          setCurrentUser(null);
          navigate('/login');
        }
    }

    return (
        <div style={styles.header}>
            <span style={styles.title}>Grid Talk</span>
            <button
                style={styles.logoutBtn}
                onClick={handleLogout}>
                로그아웃
            </button>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    minHeight: '57px', padding: '12px 20px', boxSizing: 'border-box',
    borderBottom: '1px solid #ddd', backgroundColor: '#fff'
  },
  title: {
    fontWeight: 600,
    fontSize: '16px',
  },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#e53e3e', fontSize: '14px',
  },
};