import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { BookOpen } from 'lucide-react';
import styles from './Auth.module.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const from = location.state?.from?.pathname ||
      (user?.role === 'ADMIN' ? '/admin' :
        user?.role === 'LIBRARIAN' ? '/librarian' :
        '/dashboard');

    navigate(from, { replace: true });
  }, [isAuthenticated, isLoading, location.state, navigate, user?.role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      
      const from = location.state?.from?.pathname || 
                   (user.role === 'ADMIN' ? '/admin' : 
                    user.role === 'LIBRARIAN' ? '/librarian' : 
                    '/dashboard');
                    
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <Card className={styles.authCard}>
        <Card.Body>
          <div className={styles.authHeader}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <BookOpen size={48} color="var(--primary-red)" />
            </div>
            <h1 className={styles.authTitle}>Sign In</h1>
            <p className={styles.authSubtitle}>Access your Hamo Library account</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form className={styles.authForm} onSubmit={handleLogin}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@university.edu"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className={styles.authFooter}>
            Don't have an account? <Link to="/register" className={styles.authLink}>Create one now</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
