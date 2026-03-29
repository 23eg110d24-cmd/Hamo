import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, AlertCircle } from 'lucide-react';
import { bookService } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { BookCover } from '../../components/ui/BookCover';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from './BookDetails.module.css';

export function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [reservationMessage, setReservationMessage] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const data = await bookService.getById(id);
        if (data) {
          setBook(data);
        } else {
          setError('Book not found');
        }
      } catch {
        setError('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (!book?.id || !user?.id) {
      setReservation(null);
      return;
    }

    userService.getReservations()
      .then((reservations) => {
        const match = (reservations || []).find((item) => item.book?.id === book.id && ['RESERVED', 'WAITLISTED'].includes(item.status));
        setReservation(match || null);
      })
      .catch(() => setReservation(null));
  }, [book?.id, user?.id]);

  if (loading) return <div style={{display:'flex', justifyContent:'center', padding:'4rem'}}><Spinner size="xl" /></div>;
  
  if (error || !book) {
    return (
      <div className={styles.container} style={{textAlign:'center', padding:'4rem'}}>
        <AlertCircle size={48} style={{margin:'0 auto 1rem', color:'var(--error)'}} />
        <h2>{error || 'Book Not Found'}</h2>
        <Button onClick={() => navigate('/catalog')} variant="outline" style={{marginTop:'1rem'}}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  const isAvailable = book.availableCopies > 0;
  const isMember = !user || user?.role === 'MEMBER';
  const memberActionLabel = reservation
    ? reservation.status === 'WAITLISTED'
      ? 'Waitlist Joined'
      : 'Reserved'
    : isAvailable
      ? 'Reserve Book'
      : 'Join Waitlist';

  const handleReservation = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/catalog/${id}` } } });
      return;
    }

    try {
      setIsReserving(true);
      const createdReservation = await userService.createReservation(book.id);
      setReservation(createdReservation);
      const refreshedBook = await bookService.getById(id);
      setBook(refreshedBook);
      setReservationMessage(
        createdReservation.status === 'WAITLISTED'
          ? 'You have been added to the waitlist for this title.'
          : 'Your reservation has been saved successfully.'
      );
    } catch (reservationError) {
      setReservationMessage(reservationError.message || 'Failed to save reservation.');
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation?.id) {
      return;
    }

    try {
      setIsReserving(true);
      await userService.cancelReservation(reservation.id);
      setReservation(null);
      const refreshedBook = await bookService.getById(id);
      setBook(refreshedBook);
      setReservationMessage('Your reservation has been cancelled.');
    } catch (reservationError) {
      setReservationMessage(reservationError.message || 'Failed to cancel reservation.');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/catalog" className={styles.backLink}>
        <ArrowLeft size={20} />
        Back to Catalog
      </Link>

      <div className={styles.content}>
        <div className={styles.coverSection}>
          <BookCover
            src={book.coverUrl}
            alt={book.title}
            title={book.title}
            author={book.author}
            className={styles.coverImage}
            placeholderClassName={styles.coverPlaceholder}
            iconSize={64}
          />
        </div>

        <div className={styles.infoSection}>
          <div className={styles.category}>{book.category}</div>
          <h1 className={styles.title}>{book.title}</h1>
          <p className={styles.author}>by {book.author}</p>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Published</span>
              <span className={styles.statValue}>{book.publishedYear}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Rating</span>
              <span className={styles.statValue} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                <Star size={16} fill="var(--warning)" color="var(--warning)" />
                {book.averageRating || 'N/A'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Language</span>
              <span className={styles.statValue}>{book.language || 'English'}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Availability</span>
              <Badge variant={isAvailable ? 'success' : 'warning'} style={{marginTop: '0.25rem'}}>
                {book.availableCopies} of {book.totalCopies}
              </Badge>
            </div>
          </div>

          <div className={styles.description}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            <p className={styles.descText}>{book.description || 'No description available for this title.'}</p>
          </div>

          <div className={styles.actionSection}>
            {user?.role === 'LIBRARIAN' || user?.role === 'ADMIN' ? (
               <div className={styles.issueAction}>
                 <h3 className={styles.sectionTitle} style={{fontSize: '1rem', marginBottom: '0.5rem'}}>Librarian Actions</h3>
                 <p className={styles.descText} style={{fontSize: '0.875rem', marginBottom: '1rem'}}>
                   Issue this book to a member or reserve a copy.
                 </p>
                 <div style={{display:'flex', gap:'0.5rem'}}>
                   <Button disabled={!isAvailable}>Issue Book</Button>
                   <Button variant="outline">Edit Book</Button>
                 </div>
               </div>
            ) : null}
            
            {isMember && (
              <div className={styles.memberAction}>
                <Button
                  size="lg"
                  onClick={reservation ? handleCancelReservation : handleReservation}
                  variant={reservation ? 'outline' : 'primary'}
                  disabled={isReserving}
                  isLoading={isReserving}
                >
                  {reservation ? 'Cancel Reservation' : memberActionLabel}
                </Button>
                <p className={styles.memberActionHint}>
                  {reservationMessage || (user
                    ? `Current status: ${reservation?.status || 'No active reservation'}`
                    : 'Sign in to place a reservation or join the waitlist.')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
