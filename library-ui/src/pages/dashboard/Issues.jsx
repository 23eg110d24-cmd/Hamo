import React, { useEffect, useMemo, useState } from 'react';
import { bookService } from '../../services/bookService';
import { issueService } from '../../services/issueService';
import { memberService } from '../../services/memberService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { formatCurrency } from '../../utils/currency';
import managementStyles from './Management.module.css';

const FILTER_OPTIONS = ['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'];

export function Issues() {
  const [issues, setIssues] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [returningIssueId, setReturningIssueId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [issueForm, setIssueForm] = useState({
    memberId: '',
    bookId: '',
    notes: '',
  });

  useEffect(() => {
    let mounted = true;

    const loadIssues = async () => {
      try {
        const data = await fetchIssueWorkspace();
        if (mounted) {
          setIssues(data.issues);
          setMembers(data.members);
          setBooks(data.books);
          setIssueForm((current) => resolveIssueFormDefaults(current, data));
        }
      } catch (error) {
        if (mounted) {
          setFeedback({ type: 'error', text: error.message || 'Failed to load issue workspace.' });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadIssues();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const title = issue.book?.title || '';
      const memberName = issue.member?.name || '';
      const matchesSearch = !searchTerm || `${title} ${memberName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = matchesIssueFilter(issue, activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, issues, searchTerm]);

  const availableBooks = useMemo(() => {
    return books.filter((book) => book.availableCopies > 0);
  }, [books]);

  const activeMembers = useMemo(() => {
    return members.filter((member) => member.active);
  }, [members]);

  const activeCount = issues.filter((issue) => !issue.returnDate && issue.status === 'ISSUED').length;
  const overdueCount = issues.filter((issue) => issue.status === 'OVERDUE' && !issue.returnDate).length;
  const returnedCount = issues.filter((issue) => issue.returnDate).length;

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setIssueForm((current) => ({ ...current, [name]: value }));
  };

  const refreshWorkspace = async () => {
    const data = await fetchIssueWorkspace();
    setIssues(data.issues);
    setMembers(data.members);
    setBooks(data.books);
    return data;
  };

  const handleIssueBook = async (event) => {
    event.preventDefault();
    setIssuing(true);
    setFeedback({ type: '', text: '' });

    try {
      await issueService.create({
        bookId: Number(issueForm.bookId),
        memberId: Number(issueForm.memberId),
        notes: issueForm.notes.trim(),
      });
      const updatedWorkspace = await refreshWorkspace();
      setIssueForm(resolveIssueFormDefaults({ notes: '' }, updatedWorkspace));
      setFeedback({ type: 'success', text: 'Book issued successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to issue the book.' });
    } finally {
      setIssuing(false);
    }
  };

  const handleReturnBook = async (issueId) => {
    setReturningIssueId(issueId);
    setFeedback({ type: '', text: '' });

    try {
      await issueService.returnBook(issueId);
      await refreshWorkspace();
      setFeedback({ type: 'success', text: 'Return processed and availability updated.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to return this issue.' });
    } finally {
      setReturningIssueId(null);
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
          <h1 className={managementStyles.pageTitle}>Issues & Returns</h1>
          <p className={managementStyles.pageSubtitle}>
            Manage circulation, issue titles to members, and process returns with live overdue and fine details.
          </p>
        </div>
      </div>

      <div className={managementStyles.statsGrid}>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Open Issues</span>
          <span className={managementStyles.statValue}>{activeCount}</span>
          <span className={managementStyles.statHint}>Books currently out with members</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Overdue</span>
          <span className={managementStyles.statValue}>{overdueCount}</span>
          <span className={managementStyles.statHint}>Need follow-up and fine collection</span>
        </div>
        <div className={managementStyles.statCard}>
          <span className={managementStyles.statLabel}>Completed Returns</span>
          <span className={managementStyles.statValue}>{returnedCount}</span>
          <span className={managementStyles.statHint}>Historical issue records in the ledger</span>
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
            <Card.Header title="Circulation Ledger" subtitle="Track live, overdue, and returned issues." />
            <Card.Body>
              <div className={managementStyles.toolbar} style={{ marginBottom: '1rem' }}>
                <input
                  type="search"
                  placeholder="Search by member or book"
                  className={managementStyles.searchField}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className={managementStyles.tabRow} style={{ marginBottom: '1rem' }}>
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`${managementStyles.tabButton} ${activeFilter === option ? managementStyles.activeTab : ''}`}
                    onClick={() => setActiveFilter(option)}
                  >
                    {option === 'ALL' ? 'All Records' : option}
                  </button>
                ))}
              </div>

              {filteredIssues.length === 0 ? (
                <div className={managementStyles.emptyState}>No issue records match the current filter.</div>
              ) : (
                <div className={managementStyles.tableWrap}>
                  <table className={managementStyles.table}>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Member</th>
                        <th>Timeline</th>
                        <th>Status</th>
                        <th>Fine</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map((issue) => {
                        const canReturn = !issue.returnDate;
                        return (
                          <tr key={issue.id}>
                            <td>
                              <span className={managementStyles.tableRowTitle}>{issue.book?.title}</span>
                              <span className={managementStyles.tableRowSub}>{issue.book?.author || 'Unknown author'}</span>
                            </td>
                            <td>
                              <span className={managementStyles.tableRowTitle}>{issue.member?.name}</span>
                              <span className={managementStyles.tableRowSub}>{issue.member?.membershipNumber}</span>
                            </td>
                            <td>
                              <span className={managementStyles.tableRowTitle}>Issued {formatDate(issue.issueDate)}</span>
                              <span className={managementStyles.tableRowSub}>Due {formatDate(issue.dueDate)}</span>
                              <span className={managementStyles.tableRowSub}>
                                {issue.returnDate ? `Returned ${formatDate(issue.returnDate)}` : 'Awaiting return'}
                              </span>
                            </td>
                            <td>
                              <Badge variant={resolveIssueBadge(issue)}>
                                {issue.returnDate && issue.status === 'OVERDUE' ? 'Returned Late' : issue.status}
                              </Badge>
                            </td>
                            <td>
                              <span className={managementStyles.tableRowTitle}>{formatCurrency(issue.fineAmount || 0)}</span>
                              <span className={managementStyles.tableRowSub}>
                                {issue.finePaid ? 'Fine cleared' : 'Fine pending'}
                              </span>
                            </td>
                            <td>
                              {canReturn ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  isLoading={returningIssueId === issue.id}
                                  onClick={() => handleReturnBook(issue.id)}
                                >
                                  Return Book
                                </Button>
                              ) : (
                                <span className={managementStyles.noteText}>Completed</span>
                              )}
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
        </div>

        <div className={managementStyles.sideColumn}>
          <Card>
            <Card.Header
              title="Issue a Book"
              subtitle="Select an active member and an available title to create a new issue record."
            />
            <Card.Body>
              <form onSubmit={handleIssueBook} className={managementStyles.fieldGrid}>
                <div className={managementStyles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="issue-member" className={managementStyles.fieldLabel}>Member</label>
                  <select
                    id="issue-member"
                    name="memberId"
                    className={managementStyles.selectField}
                    value={issueForm.memberId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select member</option>
                    {activeMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.membershipNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={managementStyles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="issue-book" className={managementStyles.fieldLabel}>Available Book</label>
                  <select
                    id="issue-book"
                    name="bookId"
                    className={managementStyles.selectField}
                    value={issueForm.bookId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select book</option>
                    {availableBooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} - {book.availableCopies} available
                      </option>
                    ))}
                  </select>
                </div>
                <div className={managementStyles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="issue-notes" className={managementStyles.fieldLabel}>Notes</label>
                  <textarea
                    id="issue-notes"
                    name="notes"
                    className={managementStyles.textArea}
                    value={issueForm.notes}
                    onChange={handleFormChange}
                    placeholder="Optional circulation note"
                  />
                </div>
                <div className={managementStyles.rowActions} style={{ gridColumn: '1 / -1' }}>
                  <Button type="submit" isLoading={issuing} disabled={!availableBooks.length}>
                    Issue Selected Book
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Circulation Policy" />
            <Card.Body>
              <div className={managementStyles.summaryList}>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Loan period</span>
                  <span className={managementStyles.summaryValue}>7 days from issue date</span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Late fine</span>
                  <span className={managementStyles.summaryValue}>30 per overdue week</span>
                </div>
                <div className={managementStyles.summaryRow}>
                  <span className={managementStyles.summaryKey}>Return handling</span>
                  <span className={managementStyles.summaryValue}>Availability updates immediately</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function fetchIssueWorkspace() {
  const [issues, members, books] = await Promise.all([
    issueService.getAll(),
    memberService.getAll(),
    bookService.getAll(),
  ]);

  return {
    issues: sortIssues(issues || []),
    members: [...(members || [])].sort((first, second) => first.name.localeCompare(second.name)),
    books: [...(books || [])].sort((first, second) => first.title.localeCompare(second.title)),
  };
}

function sortIssues(issues) {
  return [...issues].sort((first, second) => {
    const firstTimestamp = new Date(first.returnDate || first.issueDate || 0).getTime();
    const secondTimestamp = new Date(second.returnDate || second.issueDate || 0).getTime();
    return secondTimestamp - firstTimestamp;
  });
}

function matchesIssueFilter(issue, filter) {
  switch (filter) {
    case 'ACTIVE':
      return issue.status === 'ISSUED' && !issue.returnDate;
    case 'OVERDUE':
      return issue.status === 'OVERDUE' && !issue.returnDate;
    case 'RETURNED':
      return Boolean(issue.returnDate);
    case 'ALL':
    default:
      return true;
  }
}

function resolveIssueBadge(issue) {
  if (issue.returnDate && issue.status === 'OVERDUE') {
    return 'warning';
  }

  if (issue.status === 'OVERDUE') {
    return 'error';
  }

  if (issue.returnDate || issue.status === 'RETURNED') {
    return 'success';
  }

  return 'primary';
}

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
}

function resolveIssueFormDefaults(current, workspace) {
  const nextMembers = (workspace.members || []).filter((member) => member.active);
  const nextBooks = (workspace.books || []).filter((book) => book.availableCopies > 0);

  return {
    memberId: current.memberId || String(nextMembers[0]?.id || ''),
    bookId: current.bookId || String(nextBooks[0]?.id || ''),
    notes: current.notes || '',
  };
}
