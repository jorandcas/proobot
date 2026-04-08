import React from 'react';

interface AnimatedBackgroundProps {
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob"></div>
      <div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply blur-xl opacity-20 animate-blob"
        style={{ animationDelay: '4s' }}
      ></div>
    </div>
  );
};
