import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, BookMarked, Users, Settings, LogOut, 
  Menu, Bell, Moon, Sun, Home, CreditCard, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './Layout.module.css';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const roleLinks = {
    MEMBER: [
      { path: '/dashboard', label: 'Overview', icon: <Home size={20} /> },
      { path: '/catalog', label: 'Book Catalog', icon: <BookOpen size={20} /> },
      { path: '/recommendations', label: 'Recommendations', icon: <BookMarked size={20} /> },
      { path: '/payments', label: 'Fines & Payments', icon: <CreditCard size={20} /> },
    ],
    LIBRARIAN: [
      { path: '/librarian', label: 'Librarian Space', icon: <LayoutDashboard size={20} /> },
      { path: '/catalog', label: 'Manage Books', icon: <BookOpen size={20} /> },
      { path: '/members', label: 'Members', icon: <Users size={20} /> },
      { path: '/issues', label: 'Issues & Returns', icon: <BookMarked size={20} /> },
    ],
    ADMIN: [
      { path: '/admin', label: 'System Overview', icon: <LayoutDashboard size={20} /> },
      { path: '/admin/users', label: 'User Management', icon: <Users size={20} /> },
      { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
    ]
  };

  const links = user ? (roleLinks[user.role] || roleLinks.MEMBER) : [];

  return (
    <div className={styles.dashContainer}>
      {/* Mobile Backdrop */}
      {sidebarOpen && <div className={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.dashLogo}>
            <BookOpen size={24} className={styles.logoIcon} />
            <span className={styles.logoText}>Hamo</span>
          </Link>
          <div className={styles.roleBadge}>{user?.role}</div>
        </div>

        <nav className={styles.sidebarNav}>
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`${styles.sidebarLink} ${location.pathname === link.path ? styles.activeLink : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/profile" className={styles.sidebarLink}>
            <Settings size={20} />
            <span>Profile Settings</span>
          </Link>
          <button onClick={handleLogout} className={`${styles.sidebarLink} ${styles.logoutLink}`}>
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.dashMain}>
        <header className={styles.dashHeader}>
          <div className={styles.dashHeaderLeft}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className={styles.pageTitle}>Dashboard</h2>
          </div>
          <div className={styles.dashHeaderRight}>
            <button className={styles.iconButton} aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button onClick={toggleTheme} className={styles.iconButton} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={styles.userProfile}>
              <div className={styles.avatarMini}>{user?.name?.charAt(0) || 'U'}</div>
            </div>
          </div>
        </header>

        <main className={styles.dashContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
