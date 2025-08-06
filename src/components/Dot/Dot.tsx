import React from "react";
import "./Dot.css";

interface Position {
  x: number;
  y: number;
}

interface DotProps {
  number: number;
  position: Position;
  isConnected?: boolean;
  isActive?: boolean;
}

const Dot: React.FC<DotProps> = ({
  number,
  position,
  isConnected = false,
  isActive = false,
}) => {
  const dotClass = [
    "dot",
    isConnected && "dot--connected",
    isActive && "dot--active",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={dotClass}
      data-number={number}
      data-x={position.x}
      data-y={position.y}
    >
      <span className="dot-number">{number}</span>
    </div>
  );
};

export default Dot;
