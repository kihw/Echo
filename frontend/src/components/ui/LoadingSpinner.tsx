'use client';

import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'white' | 'gray';
    message?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  message,
  fullScreen = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
    case 'sm':
      return 'w-4 h-4';
    case 'md':
      return 'w-8 h-8';
    case 'lg':
      return 'w-12 h-12';
    case 'xl':
      return 'w-16 h-16';
    default:
      return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
    case 'primary':
      return 'border-blue-600 border-t-transparent';
    case 'white':
      return 'border-white border-t-transparent';
    case 'gray':
      return 'border-gray-600 border-t-transparent';
    default:
      return 'border-blue-600 border-t-transparent';
    }
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${getSizeClasses()} ${getColorClasses()} border-2 border-solid rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Composant pour les états de chargement inline
export const InlineLoading: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-center gap-2 py-2">
    <LoadingSpinner size="sm" />
    {message && <span className="text-sm text-gray-600">{message}</span>}
  </div>
);

// Composant pour les boutons avec état de chargement
interface LoadingButtonProps {
    loading: boolean;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  disabled,
  className = '',
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative flex items-center justify-center gap-2 ${className} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      {children}
    </button>
  );
};

// Composant pour les overlays de chargement sur les conteneurs
export const LoadingOverlay: React.FC<{
    loading: boolean;
    message?: string;
    children: React.ReactNode;
}> = ({ loading, message, children }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <LoadingSpinner message={message} />
        </div>
      )}
    </div>
  );
};
