import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  interactive?: boolean;
  style?: React.CSSProperties;
}

/**
 * Card Studio v2 — permukaan lembut dengan elevasi berlapis.
 * Menghormati --theme-radius agar tema server tetap berlaku.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  id,
  interactive,
  style,
}) => {
  const clickable = Boolean(onClick) || interactive;
  return (
    <div
      id={id}
      onClick={onClick}
      style={style}
      className={[
        'studio-card p-6',
        clickable ? 'studio-card-interactive cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};
