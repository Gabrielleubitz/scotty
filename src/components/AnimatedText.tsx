import React, { useState, useEffect } from 'react';

interface AnimatedTextProps {
  phrases: string[];
  className?: string;
  interval?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ 
  phrases, 
  className = '',
  interval = 3000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentPhrase = phrases[currentIndex];
    
    if (!isDeleting) {
      // Typing out
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait then start deleting
        const timeout = setTimeout(() => {
          setIsDeleting(true);
          setTypingSpeed(50); // Faster when deleting
        }, interval);
        return () => clearTimeout(timeout);
      }
    } else {
      // Deleting
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setTypingSpeed(100); // Reset typing speed
        setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      }
    }
  }, [displayText, isDeleting, currentIndex, phrases, interval, typingSpeed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

