import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { userService } from '../../services/userService';
import { BookCover } from '../../components/ui/BookCover';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from './Recommendations.module.css';

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
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <Sparkles className={styles.titleIcon} />
            AI Recommendations
          </h1>
          <p className={styles.subtitle}>Curated literature based specifically on your reading history.</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Spinner size="xl" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertTriangle size={48} opacity={0.5} />
          <div>
            <h3>We need more data</h3>
            <p>Read more books to get personalized AI suggestions.</p>
          </div>
          <Link to="/catalog">
            <Button variant="outline">Browse Catalog</Button>
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {recommendations.map((book) => {
            const bookId = book.bookId || book.id;
            return (
              <div
                key={bookId}
                onClick={() => navigate(`/catalog/${bookId}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/catalog/${bookId}`);
                  }
                }}
                role="link"
                tabIndex={0}
                className={styles.cardShell}
              >
                <Card className={styles.aiCard} hoverable>
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
                    <div className={styles.scoreBadge}>
                      <Sparkles size={13} />
                      {formatScore(book.score)}
                    </div>
                  </div>
                  <Card.Body className={styles.cardBody}>
                    <div className={styles.category}>{book.category}</div>
                    <h3 className={styles.bookTitle} title={book.title}>{book.title}</h3>
                    <p className={styles.author}>{book.author}</p>

                    <div className={styles.reason}>
                      <Sparkles size={14} className={styles.reasonIcon} />
                      {book.reason}
                    </div>

                    <div className={styles.cardFooter}>
                      <Button variant="secondary" fullWidth className={styles.viewButton}>
                        View Details
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatScore(score = 0) {
  const numericScore = Number(score || 0);
  const percentage = numericScore <= 1 ? numericScore * 100 : Math.min(99, numericScore * 10);
  return `${Math.round(percentage)}% match`;
}