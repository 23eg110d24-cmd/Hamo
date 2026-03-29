import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, AlertCircle } from 'lucide-react';
import { bookService } from '../../services/bookService';
import { BookCover } from '../../components/ui/BookCover';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import styles from './Catalog.module.css';

export function Catalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    const fetchBooks = async () => {
      try {
        const data = await bookService.getAll();
        if (mounted) {
          setBooks(Array.isArray(data) ? data : (data.content || []));
        }
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBooks();
    return () => { mounted = false; };
  }, []);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || book.category === categoryFilter;
    const matchesAvailability =
      availabilityFilter === 'ALL' ||
      (availabilityFilter === 'AVAILABLE' && book.availableCopies > 0) ||
      (availabilityFilter === 'WAITLIST' && book.availableCopies <= 0);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = ['All', ...new Set(books.map(b => b.category).filter(Boolean))];

  return (
    <div className={styles.catalogContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Library Catalog</h1>
          <p className={styles.subtitle}>Discover thousands of titles across multiple disciplines.</p>
        </div>
        
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              placeholder="Search by title or author..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="WAITLIST">Waiting List</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
          <Spinner size="xl" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin:'0 auto 1rem', opacity: 0.5 }} />
          <h3>No books found matching your criteria</h3>
          <button onClick={() => {setSearchTerm(''); setCategoryFilter('All'); setAvailabilityFilter('ALL');}} 
                  style={{ background:'none', border:'none', color:'var(--primary-red)', cursor:'pointer', marginTop:'1rem', textDecoration:'underline'}}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredBooks.map(book => (
            <Link to={`/catalog/${book.id}`} key={book.id} style={{ textDecoration:'none', color:'inherit' }}>
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
                  <div className={styles.availabilityBadge}>
                    <Badge variant={book.availableCopies > 0 ? 'success' : 'warning'}>
                      {book.availableCopies > 0 ? 'Available' : 'Issued Out'}
                    </Badge>
                  </div>
                </div>
                <div className={styles.bookInfo}>
                  <div className={styles.bookCategory}>{book.category}</div>
                  <h3 className={styles.bookTitle} title={book.title}>{book.title}</h3>
                  <p className={styles.bookAuthor}>{book.author}</p>
                  
                  <div className={styles.bookFooter}>
                    <div className={styles.bookStats}>
                      <Star size={16} className={styles.ratingIcon} fill="currentColor" />
                      <span>{book.averageRating || 'New'}</span>
                    </div>
                    <div className={styles.bookStats}>
                      {book.availableCopies} / {book.totalCopies} Copies
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
