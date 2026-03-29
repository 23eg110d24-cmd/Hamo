import React from 'react';
import styles from './Spinner.module.css';

export function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const sizeClass = styles[size] || styles.md;
  const colorClass = styles[color] || styles.primary;

  return (
    <div className={`${styles.spinner} ${sizeClass} ${colorClass} ${className}`} />
  );
}
