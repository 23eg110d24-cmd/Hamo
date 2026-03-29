import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Database, Server, CreditCard, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { dashboardService } from '../../services/dashboardService';
import { systemUserService } from '../../services/systemUserService';
import styles from './Dashboard.module.css';

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [overview, userList] = await Promise.all([
          dashboardService.getOverview(),
          systemUserService.getAll(),
        ]);

        if (mounted) {
          setDashboard(overview);
          setUsers(userList || []);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const healthState = useMemo(() => {
    const circulationBase = (dashboard?.activeIssues || 0) + (dashboard?.overdueIssues || 0);
    const overdueRatio = circulationBase ? (dashboard.overdueIssues / circulationBase) * 100 : 0;

    if (overdueRatio >= 35) {
      return { label: 'Needs Attention', color: 'var(--error)' };
    }

    if (overdueRatio >= 20) {
      return { label: 'Monitoring', color: 'var(--warning)' };
    }

    return { label: 'Stable', color: 'var(--success)' };
  }, [dashboard]);

  const roleCounts = useMemo(() => {
    return users.reduce((counts, user) => {
      counts[user.role] = (counts[user.role] || 0) + 1;
      return counts;
    }, {});
  }, [users]);

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
              <span className={styles.statLabel}>Total Books</span>
              <Database className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{dashboard?.totalBooks || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Total Users</span>
              <Users className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{dashboard?.totalUsers || 0}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>System Health</span>
              <Server className={styles.statIcon} size={20} style={{ color: healthState.color }}/>
            </div>
            <div className={styles.statValue} style={{ color: healthState.color }}>{healthState.label}</div>
          </div>
          <div className={styles.statCard}>
             <div className={styles.statHeader}>
               <span className={styles.statLabel}>Fines Collected</span>
               <CreditCard className={styles.statIcon} size={20} />
             </div>
             <div className={styles.statValue}>{formatCurrency(dashboard?.finesCollected || 0)}</div>
          </div>
        </div>

        <Card>
          <Card.Header title="Operational Snapshot" subtitle="Live metrics pulled from the backend." />
          <Card.Body>
             <div style={{ display: 'grid', gap: '1rem' }}>
               <div className={styles.listRow}>
                 <div className={styles.itemInfo}>
                   <div className={styles.itemTitle}>Members in system</div>
                   <div className={styles.itemSub}>Active member profiles available for circulation</div>
                 </div>
                 <div className={styles.itemAction}>{dashboard?.totalMembers || 0}</div>
               </div>
               <div className={styles.listRow}>
                 <div className={styles.itemInfo}>
                   <div className={styles.itemTitle}>Active circulation</div>
                   <div className={styles.itemSub}>Current items issued right now</div>
                 </div>
                 <div className={styles.itemAction}>{dashboard?.activeIssues || 0}</div>
               </div>
               <div className={styles.listRow}>
                 <div className={styles.itemInfo}>
                   <div className={styles.itemTitle}>Outstanding fines</div>
                   <div className={styles.itemSub}>Pending collection on overdue records</div>
                 </div>
                 <div className={styles.itemAction}>{formatCurrency(dashboard?.outstandingFines || 0)}</div>
               </div>
               <div className={styles.listRow}>
                 <div className={styles.itemInfo}>
                   <div className={styles.itemTitle}>Role spread</div>
                   <div className={styles.itemSub}>Admins, librarians, and members currently active in the platform</div>
                 </div>
                 <div className={styles.itemAction}>
                   {roleCounts.ADMIN || 0}
                   {' / '}
                   {roleCounts.LIBRARIAN || 0}
                   {' / '}
                   {roleCounts.MEMBER || 0}
                 </div>
               </div>
             </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
