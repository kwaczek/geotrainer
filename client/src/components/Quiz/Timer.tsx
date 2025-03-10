import React from 'react';

interface TimerProps {
  timeLeft: number;
  isAnswered: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, isAnswered }) => {
  if (!timeLeft || isAnswered) return null;

  return (
    <div className="text-sm text-gray-600 mb-2">
      Time remaining: {timeLeft} seconds
    </div>
  );
};

export default Timer;
