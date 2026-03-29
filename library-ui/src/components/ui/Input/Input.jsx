import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export const Input = forwardRef(({ 
  label, 
  error, 
  id,
  className = '', 
  fullWidth = true,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
