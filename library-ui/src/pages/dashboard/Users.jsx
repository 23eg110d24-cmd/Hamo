import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { systemUserService } from '../../services/systemUserService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import managementStyles from './Management.module.css';

export function Users() {
  const { user: sessionUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [busyUserId, setBusyUserId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        if (mounted) {
          setUsers(data);
        }
      } catch (error) {
        if (mounted) {
          setFeedback({ type: 'error', text: error.message || 'Failed to load system users.' });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => {
      const matchesSearch = !searchTerm || `${entry.name} ${entry.email}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || entry.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm, users]);

  const roleCounts = useMemo(() => {
    return users.reduce((accumulator, entry) => {
      accumulator[entry.role] = (accumulator[entry.role] || 0) + 1;
      return accumulator;
    }, {});
  }, [users]);

  const handleToggleStatus = async (entry) => {
    setBusyUserId(entry.id);
    setFeedback({ type: '', text: '' });

    try {
      const updatedUser = await systemUserService.updateStatus(entry.id, !entry.active);
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
      setFeedback({
        type: 'success',
        text: `${updatedUser.name} is now ${updatedUser.active ? 'active' : 'inactive'}.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to update account status.' });
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className={managementStyles.page}>
      <div className={managementStyles.pageHeader}>
        <div className={managementStyles.pageTitleGroup}>
          <h1 className={managementStyles.pageTitle}>System Users</h1>
          <p className={managementStyles.pageSubtitle}>
            Review platform accounts, see role distribution, and enable or disable access for staff and members.
          </p>
        </div>
      </div>

      <div className={managementStyles.statsGrid}>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>All Accounts</span>
          <span className={managementStyles.statValue}>{users.length}</span>
          <span className={managementStyles.statHint}>Registered platform users</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Admins</span>
          <span className={managementStyles.statValue}>{roleCounts.ADMIN || 0}</span>
          <span className={managementStyles.statHint}>System oversight accounts</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Librarians</span>
          <span className={managementStyles.statValue}>{roleCounts.LIBRARIAN || 0}</span>
          <span className={managementStyles.statHint}>Circulation and catalog operators</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Members</span>
          <span className={managementStyles.statValue}>{roleCounts.MEMBER || 0}</span>
          <span className={managementStyles.statHint}>Library patrons with portal access</span>
        </div>
      </div>

      {feedback.text ? (
        <div
          className={`${managementStyles.message} ${feedback.type === 'error' ? managementStyles.errorMessage : managementStyles.successMessage}`}
        >
          {feedback.text}
        </div>
      ) : null}

      <Card>
        <Card.Header title="Account Directory" subtitle="Use filters to narrow down roles and access states." />
        <Card.Body>
          <div className={managementStyles.toolbar} style={{ marginBottom: '1rem' }}>
            <input
              type="search"
              placeholder="Search users"
              className={managementStyles.searchField}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className={managementStyles.selectField}
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>

          {filteredUsers.length === 0 ? (
            <div className={managementStyles.emptyState}>No user accounts match the current filters.</div>
          ) : (
            <div className={managementStyles.tableWrap}>
              <table className={managementStyles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((entry) => {
                    const isSelf = Number(entry.id) === Number(sessionUser?.id);
                    return (
                      <tr key={entry.id}>
                        <td>
                          <span className={managementStyles.tableRowTitle}>{entry.name}</span>
                          <span className={managementStyles.tableRowSub}>{entry.email}</span>
                        </td>
                        <td>
                          <div className={managementStyles.inlineMeta}>
                            <ShieldCheck size={16} color="var(--primary-red)" />
                            <span>{entry.role}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant={entry.active ? 'success' : 'warning'}>
                            {entry.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>{formatDate(entry.createdAt)}</td>
                        <td>
                          <div className={managementStyles.rowActions}>
                            <Button
                              variant={entry.active ? 'outline' : 'secondary'}
                              size="sm"
                              disabled={isSelf}
                              isLoading={busyUserId === entry.id}
                              onClick={() => handleToggleStatus(entry)}
                            >
                              {entry.active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                          {isSelf ? (
                            <span className={managementStyles.tableRowSub}>Your current session</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Admin Guidance" />
        <Card.Body>
          <div className={managementStyles.summaryList}>
            <div className={managementStyles.summaryRow}>
              <span className={managementStyles.summaryKey}>Role management</span>
              <span className={managementStyles.summaryValue}>Current release supports status control only</span>
            </div>
            <div className={managementStyles.summaryRow}>
              <span className={managementStyles.summaryKey}>Self protection</span>
              <span className={managementStyles.summaryValue}>You cannot disable your own active session here</span>
            </div>
            <div className={managementStyles.summaryRow}>
              <span className={managementStyles.summaryKey}>Best use</span>
              <span className={managementStyles.summaryValue}>Disable accounts when access should be paused immediately</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

async function fetchUsers() {
  const users = await systemUserService.getAll();
  return [...(users || [])].sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));
}

function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Date(value).toLocaleDateString();
}
