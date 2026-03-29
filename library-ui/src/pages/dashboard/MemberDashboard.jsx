import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, AlertTriangle, CreditCard, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { formatCurrency } from '../../utils/currency';
import styles from './Dashboard.module.css';

export function MemberDashboard() {
  useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [readingInsights, setReadingInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDashboardData = async () => {
      try {
        const [issuesData, recsData, reservationsData, insightsData] = await Promise.all([
          userService.getIssues(),
          userService.getRecommendations(),
          userService.getReservations(),
          userService.getReadingInsights()
        ]);
        if (mounted) {
          setIssues(issuesData || []);
          setRecommendations(recsData || []);
          setReservations((reservationsData || []).filter((reservation) => ['RESERVED', 'WAITLISTED'].includes(reservation.status)));
          setReadingInsights(insightsData || null);
        }
      } catch (e) {
        console.error("Dashboard failed to load", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><Spinner size="xl" /></div>;

  const activeIssues = issues.filter(i => i.status !== 'RETURNED');
  const activeReservations = reservations.filter((reservation) => reservation.status === 'RESERVED');
  const pendingFines = activeIssues.reduce((sum, i) => sum + (i.fineAmount || 0), 0) - activeIssues.reduce((sum, i) => sum + (i.finePaid ? i.fineAmount : 0), 0);

  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.mainColumn}>
        <div className={styles.statCards}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Active Now</span>
              <BookOpen className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{activeIssues.length + activeReservations.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Reservations</span>
              <AlertTriangle className={styles.statIcon} size={20} />
            </div>
            <div className={styles.statValue}>{reservations.length}</div>
          </div>
          <div className={styles.statCard} style={{ borderColor: pendingFines > 0 ? 'var(--error)' : undefined }}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel} style={{ color: pendingFines > 0 ? 'var(--error)' : undefined }}>Outstanding Fines</span>
              <CreditCard className={styles.statIcon} size={20} color={pendingFines > 0 ? 'var(--error)' : undefined} />
            </div>
            <div className={styles.statValue}>{formatCurrency(pendingFines)}</div>
          </div>
        </div>

        <Card>
          <Card.Header 
            title="Active Items" 
            action={<Link to="/catalog"><Button variant="outline" size="sm">Browse Catalog</Button></Link>}
          />
          <Card.Body>
            {activeIssues.length === 0 && activeReservations.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} opacity={0.5} />
                <p>You have no active items at the moment.</p>
              </div>
            ) : (
              <div>
                {activeReservations.map((reservation) => (
                  <div key={`reservation-${reservation.id}`} className={styles.listRow}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitle}>{reservation.book?.title}</div>
                      <div className={styles.itemSub}>
                        Reserved on {new Date(reservation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.itemAction}>
                      <Badge variant="success">Reserved</Badge>
                    </div>
                  </div>
                ))}
                {activeIssues.map(issue => {
                  const isOverdue = new Date(issue.dueDate) < new Date();
                  return (
                    <div key={issue.id} className={styles.listRow}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitle}>{issue.book.title}</div>
                        <div className={styles.itemSub} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: isOverdue ? 'var(--error)' : 'var(--text-muted)' }}>
                            Due: {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                          {isOverdue && <Badge variant="error">OVERDUE</Badge>}
                        </div>
                      </div>
                      <div className={styles.itemAction}>
                        {!isOverdue ? (
                           <Badge variant="success">Active</Badge> 
                        ) : (
                           <Button size="sm" variant="danger" onClick={() => navigate('/payments')}>Pay Fine</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header title="Reservations & Waitlist" />
          <Card.Body>
            {reservations.length === 0 ? (
              <div className={styles.emptyState}>
                <AlertTriangle size={48} opacity={0.5} />
                <p>You do not have any active reservations right now.</p>
              </div>
            ) : (
              <div>
                {reservations.map((reservation) => (
                  <div key={reservation.id} className={styles.listRow}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitle}>{reservation.book?.title}</div>
                      <div className={styles.itemSub}>
                        Added on {new Date(reservation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.itemAction}>
                      <Badge variant={reservation.status === 'WAITLISTED' ? 'warning' : 'success'}>
                        {reservation.status === 'WAITLISTED' ? 'Waitlisted' : 'Reserved'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className={styles.sideColumn}>
        <Card>
          <Card.Header title="AI Reading Insight" subtitle="Generated from your borrowing patterns" />
          <Card.Body>
            {readingInsights ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge variant="primary">{readingInsights.readingPersona}</Badge>
                  <div className={styles.itemSub} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} color="var(--primary-red)" />
                    {readingInsights.completedBooks} completed
                  </div>
                </div>
                <div className={styles.itemSub} style={{ lineHeight: 1.6 }}>
                  {readingInsights.summary}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(readingInsights.focusAreas || []).map((focusArea) => (
                    <Badge key={focusArea} variant="default">{focusArea}</Badge>
                  ))}
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)' }}>
                  <div className={styles.itemTitle} style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>Next Best Action</div>
                  <div className={styles.itemSub}>{readingInsights.nextAction}</div>
                </div>
                <div className={styles.itemSub}>{readingInsights.attentionNote}</div>
              </div>
            ) : (
              <div className={styles.emptyState} style={{padding: '2rem 1rem'}}>
                <Sparkles size={36} opacity={0.5} />
                <p>Your AI reading insight will appear here once data loads.</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card hoverable>
          <Card.Header title="AI Recommended" subtitle="Based on your read history" />
          <Card.Body>
             {recommendations.length === 0 ? (
               <div className={styles.emptyState} style={{padding: '2rem 1rem'}}>
                 <AlertTriangle size={36} opacity={0.5} />
                 <p>Not enough history to recommend.</p>
               </div>
             ) : (
               <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                 {recommendations.slice(0,3).map(rec => (
                   <Link to={`/catalog/${rec.bookId}`} key={rec.bookId} style={{ textDecoration: 'none', color: 'inherit' }}>
                     <div className={`${styles.listRow} ${styles.listRowHover}`} style={{ padding: '0.5rem', border: 'none' }}>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitle} style={{ fontSize: '0.875rem' }}>{rec.title}</div>
                          <div className={styles.itemSub} style={{ fontSize: '0.75rem', lineHeight: 1.3, marginTop: '2px' }}>
                            {rec.reason}
                          </div>
                        </div>
                        <ChevronRight size={16} color="var(--text-muted)" />
                     </div>
                   </Link>
                 ))}
               </div>
             )}
          </Card.Body>
          {recommendations.length > 0 && (
            <Card.Footer style={{ justifyContent: 'center', background: 'transparent' }}>
              <Link to="/recommendations">
                <Button variant="ghost" size="sm" fullWidth>View All</Button>
              </Link>
            </Card.Footer>
          )}
        </Card>
      </div>
    </div>
  );
}
