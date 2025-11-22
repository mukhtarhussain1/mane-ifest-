import React, { useEffect, useState } from 'react';

const MESSAGES = [
  "Consulting AI Stylist...",
  "Analyzing facial features...",
  "Applying new hairstyle...",
  "Adjusting lighting and shadows...",
  "Finalizing your new look...",
  "Almost there..."
];

export const LoadingMessages: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-cyan-400/80 text-sm font-mono min-h-[20px] transition-opacity duration-500">
      {MESSAGES[index]}
    </div>
  );
};
