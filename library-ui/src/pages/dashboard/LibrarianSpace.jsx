import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Users, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { issueService } from '../../services/issueService';
import { memberService } from '../../services/memberService';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from './Dashboard.module.css';

export function LibrarianSpace() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeIssues: 0,
    activeMembers: 0,
    returnsToday: 0,
    overdueIssues: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadWorkspace = async () => {
      try {
        const [dashboard, members, issues] = await Promise.all([
          dashboardService.getOverview(),
          memberService.getAll(),
          issueService.getAll(),
        ]);

        if (!mounted) {
          return;
        }

        setStats({
          activeIssues: dashboard.activeIssues || 0,
          activeMembers: (members || []).filter((member) => member.active).length,
          returnsToday: (issues || []).filter((issue) => isToday(issue.returnDate)).length,
          overdueIssues: dashboard.overdueIssues || 0,
        });
        setRecentActivity(buildRecentActivity(issues || []));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWorkspace();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.mainColumn}>
        <div className={styles.statCards}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Books Checked Out</span>
              <BookOpen className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{stats.activeIssues}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Active Members</span>
              <Users className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{stats.activeMembers}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Returns Today</span>
              <Clock className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{stats.returnsToday}</div>
          </div>
          <div className={styles.statCard} style={{ borderColor: 'var(--error)' }}>
             <div className={styles.statHeader}>
               <span className={styles.statLabel} style={{ color: 'var(--error)' }}>Overdue Books</span>
               <AlertTriangle className={styles.statIcon} size={20} color="var(--error)" />
             </div>
             <div className={styles.statValue}>{stats.overdueIssues}</div>
          </div>
        </div>

        <Card>
          <Card.Header 
            title="Librarian Quick Actions" 
          />
          <Card.Body>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Link to="/issues" style={{ textDecoration: 'none' }}>
                  <Button fullWidth variant="outline" size="lg" style={{ height: '100%', padding: '2rem 1rem'}}>
                    Issue / Return Book
                  </Button>
                </Link>
                <Link to="/catalog" style={{ textDecoration: 'none' }}>
                  <Button fullWidth variant="outline" size="lg" style={{ height: '100%', padding: '2rem 1rem'}}>
                    Manage Catalog
                  </Button>
                </Link>
                <Link to="/members" style={{ textDecoration: 'none' }}>
                  <Button fullWidth variant="outline" size="lg" style={{ height: '100%', padding: '2rem 1rem'}}>
                    Register Member
                  </Button>
                </Link>
                <Link to="/issues" style={{ textDecoration: 'none' }}>
                  <Button fullWidth variant="outline" size="lg" style={{ height: '100%', padding: '2rem 1rem'}}>
                    Process Fines
                  </Button>
                </Link>
             </div>
          </Card.Body>
        </Card>
      </div>

      <div className={styles.sideColumn}>
        <Card>
          <Card.Header title="Recent Activity" />
          <Card.Body>
             {recentActivity.length === 0 ? (
               <div className={styles.emptyState}>
                 <Clock size={42} opacity={0.5} />
                 <p>No circulation activity recorded yet.</p>
               </div>
             ) : recentActivity.map((activity) => (
               <div key={activity.key} className={styles.listRow}>
                  <div className={styles.itemInfo}>
                     <div className={styles.itemTitle}>{activity.title}</div>
                     <div className={styles.itemSub}>{activity.subtitle}</div>
                  </div>
                  <div className={styles.itemSub}>{activity.date}</div>
               </div>
             ))}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

function buildRecentActivity(issues) {
  return [...issues]
    .sort((first, second) => {
      return new Date(second.returnDate || second.issueDate || 0) - new Date(first.returnDate || first.issueDate || 0);
    })
    .slice(0, 5)
    .map((issue) => ({
      key: issue.id,
      title: issue.book?.title || 'Untitled book',
      subtitle: issue.returnDate
        ? `Returned by ${issue.member?.name || 'Unknown member'}`
        : `Issued to ${issue.member?.name || 'Unknown member'}`,
      date: new Date(issue.returnDate || issue.issueDate || Date.now()).toLocaleDateString(),
    }));
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const today = new Date().toLocaleDateString();
  return new Date(value).toLocaleDateString() === today;
}
