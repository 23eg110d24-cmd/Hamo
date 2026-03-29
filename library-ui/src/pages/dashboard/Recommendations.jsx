import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { userService } from '../../services/userService';
import { BookCover } from '../../components/ui/BookCover';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from '../catalog/Catalog.module.css';

export function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchRecommendations = async () => {
      try {
         const data = await userService.getRecommendations();
         if (mounted) setRecommendations(data || []);
      } catch (err) {
         console.error('Failed to load recommendations', err);
      } finally {
         if (mounted) setLoading(false);
      }
    };
    fetchRecommendations();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={styles.catalogContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <Sparkles color="var(--primary-red)" />
            AI Recommendations
          </h1>
          <p className={styles.subtitle}>Curated literature based specifically on your reading history.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
          <Spinner size="xl" />
        </div>
      ) : recommendations.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem', color: 'var(--text-muted)' }}>
          <AlertTriangle size={48} style={{ margin:'0 auto 1rem', opacity: 0.5 }} />
          <h3>We need more data</h3>
          <p>Read more books to get personalized AI suggestions.</p>
          <Link to="/catalog">
             <Button variant="outline" style={{marginTop:'1.5rem'}}>Browse Catalog</Button>
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {recommendations.map(book => (
            <div
              key={book.bookId || book.id}
              onClick={() => navigate(`/catalog/${book.bookId || book.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/catalog/${book.bookId || book.id}`);
                }
              }}
              role="link"
              tabIndex={0}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <Card className={styles.bookCard} hoverable>
                <div className={styles.coverContainer}>
                  <BookCover
                    src={book.coverUrl}
                    alt={book.title}
                    title={book.title}
                    author={book.author}
                    className={styles.coverImage}
                    placeholderClassName={styles.coverPlaceholder}
                    iconSize={48}
                  />
                  <div className={styles.availabilityBadge} style={{background:'var(--bg-main)', color:'var(--primary-red)', padding:'0.25rem 0.5rem', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:'0.75rem'}}>
                    Score: {(book.score * 100).toFixed(0)}%
                  </div>
                </div>
                <div className={styles.bookInfo}>
                  <div className={styles.bookCategory}>{book.category}</div>
                  <h3 className={styles.bookTitle} title={book.title}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                  
                  <div style={{marginTop:'1rem', padding:'0.75rem', background:'var(--bg-surface-hover)', borderRadius:'var(--radius-md)', fontSize:'0.875rem', color:'var(--text-main)', fontStyle:'italic'}}>
                    <Sparkles size={14} style={{display:'inline', marginRight:'0.25rem', color:'var(--primary-red)'}}/>
                    "{book.reason}"
                  </div>
                  
                  <div className={styles.bookFooter} style={{marginTop:'auto', borderTop:'none', padding:'0', display:'block'}}>
                    <Button variant="secondary" fullWidth style={{marginTop:'1.5rem', display:'flex', justifyContent:'space-between'}}>
                      View Details
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
