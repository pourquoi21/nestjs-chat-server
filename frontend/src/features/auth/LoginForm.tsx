import React, { useState } from 'react';

interface Props {
  onLogin: (email: string, password: any) => void;
}

const LoginForm = ({ onLogin }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Grid Talk 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.fieldGroup}>
          <input
            style={styles.input}
            type="email" 
            placeholder="이메일" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            style={styles.input}
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" style={styles.submitButton}>
          로그인
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#FFFFFF', border: '0.5px solid #EAEAEA', borderRadius: '12px', padding: '2rem 1.5rem' },
  title: { fontSize: '16px', fontWeight: 500, color: '#1A1A1A', margin: '0 0 1.5rem' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #D1D1D1', borderRadius: '6px', fontSize: '14px' },
  submitButton: { width: '100%', background: '#3B79C4', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 0', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
};

export default LoginForm;