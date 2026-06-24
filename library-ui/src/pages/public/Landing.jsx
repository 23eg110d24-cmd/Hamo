import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { BookOpen, Search, Sparkles, CreditCard } from 'lucide-react';
import styles from './Landing.module.css';

export function Landing() {
  return (
    <div>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            The Future of <span className={styles.highlight}>Academic</span> Library Management
          </h1>
          <p className={styles.subtitle}>
            Hamo provides a sleek, robust platform for institutions. Discover, issue, and manage literature with a premium interface.
          </p>
          <div className={styles.ctaGroup}>
            <Link to="/register">
              <Button size="lg" variant="primary">Become a Member</Button>
            </Link>
            <Link to="/catalog">
              <Button size="lg" variant="outline">Browse Catalog</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Everything You Need</h2>
        </div>
        <div className={styles.grid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <Search size={28} />
            </div>
            <h3 className={styles.featureTitle}>Deep Cataloging</h3>
            <p className={styles.featureDesc}>
              Quickly find any publication using our comprehensive, filterable academic search engine tailored for speed.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <Sparkles size={28} />
            </div>
            <h3 className={styles.featureTitle}>AI Recommendations</h3>
            <p className={styles.featureDesc}>
              Discover your next research asset through contextual intelligent recommendations powered by your history.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <CreditCard size={28} />
            </div>
            <h3 className={styles.featureTitle}>Fast Fine Payments</h3>
            <p className={styles.featureDesc}>
              Manage and clear late fines instantly using our integrated, swift digital checkout experience.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
