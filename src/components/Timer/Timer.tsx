import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  isRunning: boolean;
  startTime: number | null;
  endTime: number | null;
}

const Timer: React.FC<TimerProps> = ({ isRunning, startTime, endTime }) => {
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100); // Update every 100ms for smooth display
    } else if (endTime && startTime) {
      // Show final time when completed
      setCurrentTime(endTime - startTime);
    } else if (!isRunning && !startTime) {
      // Reset timer
      setCurrentTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime, endTime]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10); // Show centiseconds

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${seconds}.${ms.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="timer-container">
      <div className="timer-label">Time:</div>
      <div className={`timer-display ${isRunning ? 'running' : ''}`}>
        {formatTime(currentTime)}
      </div>
    </div>
  );
};

export default Timer;
