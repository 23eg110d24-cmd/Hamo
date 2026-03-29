import React from 'react';
import styles from './Button.module.css';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  fullWidth = false,
  disabled,
  ...props 
}) {
  const baseClass = styles.button;
  const variantClass = styles[variant] || styles.primary;
  const sizeClass = styles[size] || styles.md;
  const widthClass = fullWidth ? styles.fullWidth : '';
  
  const combinedClass = [baseClass, variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button 
      className={combinedClass} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className={styles.spinner}></span> : children}
    </button>
  );
}
