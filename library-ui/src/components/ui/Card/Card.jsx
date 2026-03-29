import React from 'react';
import styles from './Card.module.css';

export function Card({ children, className = '', hoverable = false, ...props }) {
  const combinedClass = `${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`;
  return (
    <div className={combinedClass} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.headerContent}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`${styles.body} ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
