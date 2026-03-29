import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Moon, Sun, User as UserIcon, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button/Button';
import styles from './Layout.module.css';

export function MainLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'LIBRARIAN') return '/librarian';
    return '/dashboard';
  };

  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <div className={`container ${styles.navContainer}`}>
          <Link to="/" className={styles.logo}>
            <BookOpen className={styles.logoIcon} />
            <span className={styles.logoText}>Hamo</span>
          </Link>

          <nav className={styles.navLinks}>
            <Link to="/catalog" className={styles.navLink}>Catalog</Link>
            
            <button onClick={toggleTheme} className={styles.iconButton} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <Link to={getDashboardPath()}>
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <div className={styles.dropdownTrigger}>
                  <div className={styles.avatar}>
                    <UserIcon size={16} />
                  </div>
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user?.name}</p>
                      <p className={styles.dropdownEmail}>{user?.email}</p>
                    </div>
                    <Link to="/profile" className={styles.dropdownItem}>Profile Settings</Link>
                    <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.dropdownDanger}`}>
                      <LogOut size={16} className={styles.dropdownItemIcon} />
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            ) : !isLoading ? (
              <div className={styles.authActions}>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </div>
            ) : (
              <div className={styles.authPlaceholder} aria-hidden="true" />
            )}
            
            <button className={styles.mobileMenuButton}>
              <Menu size={24} />
            </button>
          </nav>
        </div>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerContainer}`}>
          <div className={styles.footerBrand}>
            <BookOpen size={24} className={styles.footerIcon} />
            <span>Hamo Library Systems</span>
          </div>
          <p className={styles.footerText}>
            © {new Date().getFullYear()} Advanced Academic Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
