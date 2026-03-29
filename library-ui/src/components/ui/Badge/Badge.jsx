import React from 'react';
import styles from './Badge.module.css';

export function Badge({ children, variant = 'default', className = '' }) {
  const baseClass = styles.badge;
  const variantClass = styles[variant] || styles.default;
  
  return (
    <span className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
