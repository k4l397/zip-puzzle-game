import React, { useState, useEffect } from "react";
import "./Timer.css";

interface TimerProps {
  startTime: number | null;
  endTime: number | null;
  isRunning: boolean;
}

const Timer: React.FC<TimerProps> = ({ startTime, endTime, isRunning }) => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let intervalId: number;

    if (isRunning && startTime) {
      intervalId = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100); // Update every 100ms for smooth display
    } else if (endTime && startTime) {
      // Game is complete, show final time
      setCurrentTime(endTime - startTime);
    } else {
      // Game hasn't started or has been reset
      setCurrentTime(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, startTime, endTime]);

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((timeMs % 1000) / 10);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    } else {
      return `${seconds}.${centiseconds.toString().padStart(2, "0")}s`;
    }
  };

  return (
    <div
      className={`timer ${isRunning ? "timer--running" : ""} ${endTime ? "timer--completed" : ""}`}
    >
      <div className="timer-icon">⏱️</div>
      <div className="timer-display">{formatTime(currentTime)}</div>
    </div>
  );
};

export default Timer;
