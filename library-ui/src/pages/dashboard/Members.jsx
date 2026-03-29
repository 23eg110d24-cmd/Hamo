import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { memberService } from '../../services/memberService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import managementStyles from './Management.module.css';

export function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [formState, setFormState] = useState(createEmptyFormState());
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;

    const loadMembers = async () => {
      try {
        const data = await fetchMembers();
        if (mounted) {
          setMembers(data);
        }
      } catch (error) {
        if (mounted) {
          setFeedback({ type: 'error', text: error.message || 'Failed to load members.' });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  const departments = useMemo(() => (
    ['ALL', ...new Set(members.map((member) => member.department).filter(Boolean))]
  ), [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const haystack = `${member.name} ${member.email} ${member.membershipNumber}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'ALL' || member.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [departmentFilter, members, searchTerm]);

  const activeCount = members.filter((member) => member.active).length;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (member) => {
    setEditingMemberId(member.id);
    setFormState({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      department: member.department || '',
      membershipNumber: member.membershipNumber || '',
      active: Boolean(member.active),
    });
    setFeedback({ type: '', text: '' });
  };

  const handleReset = () => {
    setEditingMemberId(null);
    setFormState(createEmptyFormState());
    setFeedback({ type: '', text: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const payload = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        department: formState.department.trim(),
        membershipNumber: formState.membershipNumber.trim(),
        active: Boolean(formState.active),
      };

      if (editingMemberId) {
        await memberService.update(editingMemberId, payload);
        setFeedback({ type: 'success', text: 'Member details updated.' });
      } else {
        await memberService.create(payload);
        setFeedback({ type: 'success', text: 'Member created successfully.' });
      }

      setMembers(await fetchMembers());
      setEditingMemberId(null);
      setFormState(createEmptyFormState());
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save member.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    const confirmed = window.confirm(`Delete ${member.name}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setFeedback({ type: '', text: '' });
    try {
      await memberService.remove(member.id);
      setMembers(await fetchMembers());
      if (editingMemberId === member.id) {
        setEditingMemberId(null);
        setFormState(createEmptyFormState());
      }
      setFeedback({ type: 'success', text: 'Member removed successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to delete member.' });
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
          <h1 className={managementStyles.pageTitle}>Member Management</h1>
          <p className={managementStyles.pageSubtitle}>
            Search the member directory, update circulation status, and onboard new library members from one place.
          </p>
        </div>
      </div>

      <div className={managementStyles.statsGrid}>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Total Members</span>
          <span className={managementStyles.statValue}>{members.length}</span>
          <span className={managementStyles.statHint}>Profiles currently stored in the system</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Active Members</span>
          <span className={managementStyles.statValue}>{activeCount}</span>
          <span className={managementStyles.statHint}>Eligible to issue and reserve books</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Departments</span>
          <span className={managementStyles.statValue}>{departments.length - 1}</span>
          <span className={managementStyles.statHint}>Academic groups represented in the library</span>
        </div>
      </div>

      {feedback.text ? (
        <div
          className={`${managementStyles.message} ${feedback.type === 'error' ? managementStyles.errorMessage : managementStyles.successMessage}`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className={managementStyles.contentGrid}>
        <div className={managementStyles.mainColumn}>
          <Card>
            <Card.Header title="Directory" subtitle="Search members by name, email, or membership number." />
            <Card.Body>
              <div className={managementStyles.toolbar} style={{ marginBottom: '1rem' }}>
                <input
                  type="search"
                  placeholder="Search members"
                  className={managementStyles.searchField}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <select
                  className={managementStyles.selectField}
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department === 'ALL' ? 'All Departments' : department}
                    </option>
                  ))}
                </select>
              </div>

              {filteredMembers.length === 0 ? (
                <div className={managementStyles.emptyState}>No members match the current filters.</div>
              ) : (
                <div className={managementStyles.tableWrap}>
                  <table className={managementStyles.table}>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Membership</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.id}>
                          <td>
                            <span className={managementStyles.tableRowTitle}>{member.name}</span>
                            <span className={managementStyles.tableRowSub}>{member.email}</span>
                            <span className={managementStyles.tableRowSub}>{member.phone || 'No phone recorded'}</span>
                          </td>
                          <td>{member.membershipNumber}</td>
                          <td>{member.department || 'General'}</td>
                          <td>
                            <Badge variant={member.active ? 'success' : 'warning'}>
                              {member.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td>{formatDate(member.joinedAt)}</td>
                          <td>
                            <div className={managementStyles.rowActions}>
                              <Button variant="secondary" size="sm" onClick={() => handleEdit(member)}>
                                Edit
                              </Button>
                              {user?.role === 'ADMIN' ? (
                                <Button variant="danger" size="sm" onClick={() => handleDelete(member)}>
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className={managementStyles.sideColumn}>
          <Card>
            <Card.Header
              title={editingMemberId ? 'Edit Member' : 'Add Member'}
              subtitle={editingMemberId ? 'Update an existing member record.' : 'Create a new member profile for circulation.'}
            />
            <Card.Body>
              <form onSubmit={handleSubmit} className={managementStyles.fieldGrid}>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-name" className={managementStyles.fieldLabel}>Full Name</label>
                  <input
                    id="member-name"
                    name="name"
                    className={managementStyles.textField}
                    value={formState.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-email" className={managementStyles.fieldLabel}>Email</label>
                  <input
                    id="member-email"
                    name="email"
                    type="email"
                    className={managementStyles.textField}
                    value={formState.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-phone" className={managementStyles.fieldLabel}>Phone</label>
                  <input
                    id="member-phone"
                    name="phone"
                    className={managementStyles.textField}
                    value={formState.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-department" className={managementStyles.fieldLabel}>Department</label>
                  <input
                    id="member-department"
                    name="department"
                    className={managementStyles.textField}
                    value={formState.department}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-number" className={managementStyles.fieldLabel}>Membership Number</label>
                  <input
                    id="member-number"
                    name="membershipNumber"
                    className={managementStyles.textField}
                    value={formState.membershipNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={managementStyles.fieldGroup}>
                  <label htmlFor="member-active" className={managementStyles.fieldLabel}>Status</label>
                  <label className={managementStyles.checkboxRow}>
                    <input
                      id="member-active"
                      name="active"
                      type="checkbox"
                      checked={formState.active}
                      onChange={handleChange}
                    />
                    Member can borrow and reserve books
                  </label>
                </div>
                <div className={managementStyles.rowActions} style={{ gridColumn: '1 / -1' }}>
                  <Button type="submit" isLoading={saving}>
                    {editingMemberId ? 'Save Changes' : 'Create Member'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Quick Notes" />
            <Card.Body>
              <div className={managementStyles.summaryList}>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Fast onboarding</span>
                  <span className={managementStyles.summaryValue}>Profiles are created instantly</span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Auth accounts</span>
                  <span className={managementStyles.summaryValue}>Members can still self-register from the public app</span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Admin actions</span>
                  <span className={managementStyles.summaryValue}>
                    {user?.role === 'ADMIN' ? 'Delete controls are enabled' : 'Delete controls are admin-only'}
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

function createEmptyFormState() {
  return {
    name: '',
    email: '',
    phone: '',
    department: '',
    membershipNumber: generateMembershipNumber(),
    active: true,
  };
}

function generateMembershipNumber() {
  const seed = Date.now().toString().slice(-6);
  return `MEM-${seed}`;
}

async function fetchMembers() {
  const data = await memberService.getAll();
  return [...(data || [])].sort((first, second) => {
    return new Date(second.joinedAt || 0).getTime() - new Date(first.joinedAt || 0).getTime();
  });
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
}
