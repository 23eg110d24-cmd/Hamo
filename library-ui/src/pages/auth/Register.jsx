import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { BookOpen } from 'lucide-react';
import styles from './Auth.module.css';

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const roleRoute =
      user?.role === 'ADMIN' ? '/admin' :
      user?.role === 'LIBRARIAN' ? '/librarian' :
      '/dashboard';

    navigate(roleRoute, { replace: true });
  }, [isAuthenticated, isLoading, navigate, user?.role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmPassword: _confirmPassword, ...registerData } = formData;
      registerData.role = 'MEMBER';
      const user = await register(registerData);
      
      const roleRoute = 
        user.role === 'ADMIN' ? '/admin' : 
        user.role === 'LIBRARIAN' ? '/librarian' : 
        '/dashboard';
                    
      navigate(roleRoute, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your info.');
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
            <h1 className={styles.authTitle}>Join Hamo</h1>
            <p className={styles.authSubtitle}>Start discovering great literature today</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form className={styles.authForm} onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              required
            />
            <Input
              label="Department"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Enter your department"
              required
            />
            
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Self-registration creates a member account. Librarian and admin accounts are created by the system administrator.
            </p>

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className={styles.authFooter}>
            Already have an account? <Link to="/login" className={styles.authLink}>Sign In instead</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
