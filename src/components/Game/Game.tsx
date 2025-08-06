import React, { useState, useCallback } from "react";
import Grid from "../Grid/Grid";
import Timer from "../Timer/Timer";
import "./Game.css";

export interface GameState {
  isPlaying: boolean;
  isComplete: boolean;
  gridSize: number;
  startTime: number | null;
  endTime: number | null;
  gameResetCounter: number;
}

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isComplete: false,
    gridSize: 4,
    startTime: null,
    endTime: null,
    gameResetCounter: 0,
  });

  const handleGameStart = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isComplete: false,
      startTime: Date.now(),
      endTime: null,
    }));
  }, []);

  const handleGameComplete = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isComplete: true,
      endTime: Date.now(),
    }));
  }, []);

  const handleNewGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isComplete: false,
      startTime: null,
      endTime: null,
      gameResetCounter: prev.gameResetCounter + 1,
    }));
  }, []);

  const handleGridSizeChange = useCallback((newSize: number) => {
    setGameState((prev) => ({
      ...prev,
      gridSize: newSize,
      isPlaying: false,
      isComplete: false,
      startTime: null,
      endTime: null,
      gameResetCounter: prev.gameResetCounter + 1,
    }));
  }, []);

  const completionTime =
    gameState.startTime && gameState.endTime
      ? gameState.endTime - gameState.startTime
      : 0;

  return (
    <div className="game">
      <header className="game-header">
        <h1>Zip Puzzle</h1>
        <div className="game-controls">
          <div className="grid-size-control">
            <label htmlFor="grid-size">Grid Size:</label>
            <select
              id="grid-size"
              value={gameState.gridSize}
              onChange={(e) => handleGridSizeChange(Number(e.target.value))}
              disabled={gameState.isPlaying}
            >
              <option value={3}>3×3</option>
              <option value={4}>4×4</option>
              <option value={5}>5×5</option>
              <option value={6}>6×6</option>
            </select>
          </div>
          <button onClick={handleNewGame} className="new-game-button">
            New Puzzle
          </button>
        </div>
      </header>

      <main className="game-main">
        <div className="game-info">
          <Timer
            startTime={gameState.startTime}
            endTime={gameState.endTime}
            isRunning={gameState.isPlaying}
          />
          {gameState.isComplete && (
            <div className="completion-message">
              🎉 Puzzle Complete! Time: {Math.round(completionTime / 1000)}s
            </div>
          )}
        </div>

        <Grid
          size={gameState.gridSize}
          onGameStart={handleGameStart}
          onGameComplete={handleGameComplete}
          isComplete={gameState.isComplete}
          key={`${gameState.gridSize}-${gameState.gameResetCounter}`} // Force re-render on new game
        />
      </main>
    </div>
  );
};

export default Game;
