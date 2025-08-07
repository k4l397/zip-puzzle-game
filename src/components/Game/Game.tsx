import React, { useState, useCallback } from 'react';
import type { GameState, GameMode, Puzzle, Position } from '../../types/game';
import { GAME_CONFIG } from '../../constants/config';
import {
  generateZipPuzzle,
  generateFastZipPuzzle,
  generateSimplePuzzle,
} from '../../utils/puzzleGenerator';
import Grid from '../Grid/Grid';
import Timer from '../Timer/Timer';
import './Game.css';

const initialGameState: GameState = {
  puzzle: null,
  currentPath: [],
  isCompleted: false,
  isGenerating: false,
  startTime: null,
  endTime: null,
  gridSize: GAME_CONFIG.defaultGridSize,
};

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameMode, setGameMode] = useState<GameMode>('idle');

  const handleNewPuzzle = useCallback(async () => {
    const startGenerationTime = performance.now();

    setGameMode('generating');
    setGameState(prevState => ({
      ...prevState,
      isGenerating: true,
      puzzle: null,
      currentPath: [],
      isCompleted: false,
      startTime: null,
      endTime: null,
    }));

    try {
      // Use fast optimized generation for better UX
      const result = await generateFastZipPuzzle(gameState.gridSize);

      const endGenerationTime = performance.now();
      const generationTime = endGenerationTime - startGenerationTime;

      console.log(
        `Puzzle generation completed in ${generationTime.toFixed(2)}ms for ${gameState.gridSize}×${gameState.gridSize} grid`
      );

      if (result.success && result.puzzle) {
        setGameState(prevState => ({
          ...prevState,
          puzzle: result.puzzle,
          isGenerating: false,
        }));
        setGameMode('playing');
      } else {
        // Try standard optimized generation if fast fails
        console.warn(
          'Fast generation failed, trying standard optimized generation:',
          result.error
        );

        const fallbackResult = await generateZipPuzzle(gameState.gridSize);

        if (fallbackResult.success && fallbackResult.puzzle) {
          setGameState(prevState => ({
            ...prevState,
            puzzle: fallbackResult.puzzle,
            isGenerating: false,
          }));
          setGameMode('playing');
        } else {
          // Final fallback to simple generation
          console.warn(
            'Optimized generation failed, using simple fallback:',
            fallbackResult.error
          );
          const simplePuzzle = generateSimplePuzzle(gameState.gridSize);

          setGameState(prevState => ({
            ...prevState,
            puzzle: simplePuzzle,
            isGenerating: false,
          }));
          setGameMode('playing');
        }
      }
    } catch (error) {
      console.error('All puzzle generation methods failed:', error);

      // Emergency fallback with minimal puzzle
      const fallbackPuzzle: Puzzle = {
        id: `fallback-${Date.now()}`,
        gridSize: gameState.gridSize,
        dots: [
          { position: { x: 0, y: 0 }, number: 1, isConnected: false },
          {
            position: { x: gameState.gridSize - 1, y: gameState.gridSize - 1 },
            number: 2,
            isConnected: false,
          },
        ],
        solutionPath: [], // Will be filled by validation
      };

      setGameState(prevState => ({
        ...prevState,
        puzzle: fallbackPuzzle,
        isGenerating: false,
      }));
      setGameMode('playing');
    }
  }, [gameState.gridSize]);

  const handleGridSizeChange = useCallback((newSize: number) => {
    setGameState(prevState => ({
      ...prevState,
      gridSize: newSize,
    }));
  }, []);

  const handleGameComplete = useCallback(() => {
    const endTime = Date.now();
    setGameState(prevState => ({
      ...prevState,
      isCompleted: true,
      endTime,
    }));
    setGameMode('completed');
  }, []);

  const checkWinCondition = useCallback(
    (path: Position[]) => {
      if (!gameState.puzzle) return;

      const totalCells = gameState.puzzle.gridSize * gameState.puzzle.gridSize;

      // Check if path fills entire grid
      if (path.length === totalCells) {
        // Check if all dots are connected in correct order
        const sortedDots = [...gameState.puzzle.dots].sort(
          (a, b) => a.number - b.number
        );
        let isValidSolution = true;
        let lastFoundIndex = -1;

        for (const dot of sortedDots) {
          const dotIndex = path.findIndex(
            pos => pos.x === dot.position.x && pos.y === dot.position.y
          );

          if (dotIndex === -1 || dotIndex <= lastFoundIndex) {
            isValidSolution = false;
            break;
          }

          lastFoundIndex = dotIndex;
        }

        // Additional check: path must end on the highest numbered dot
        if (isValidSolution && sortedDots.length > 0) {
          const finalDot = sortedDots[sortedDots.length - 1];
          const lastPathPosition = path[path.length - 1];
          const endsOnFinalDot =
            lastPathPosition.x === finalDot.position.x &&
            lastPathPosition.y === finalDot.position.y;

          if (!endsOnFinalDot) {
            isValidSolution = false;
          }
        }

        if (isValidSolution) {
          handleGameComplete();
        }
      }
    },
    [gameState.puzzle, handleGameComplete]
  );

  const handlePathUpdate = useCallback(
    (newPath: { x: number; y: number }[]) => {
      if (gameState.startTime === null && newPath.length > 0) {
        setGameState(prevState => ({
          ...prevState,
          startTime: Date.now(),
        }));
      }

      setGameState(prevState => ({
        ...prevState,
        currentPath: newPath,
      }));

      // Check for win condition
      if (gameState.puzzle && newPath.length > 0) {
        checkWinCondition(newPath);
      }
    },
    [gameState.startTime, gameState.puzzle, checkWinCondition]
  );

  const getCompletionTime = (): number => {
    if (gameState.startTime && gameState.endTime) {
      return gameState.endTime - gameState.startTime;
    }
    return 0;
  };

  return (
    <div className="game-container">
      <header className="game-header">
        <h1 className="game-title">Zip Puzzle</h1>
        <div className="game-controls">
          <div className="grid-size-selector">
            <label htmlFor="grid-size">Grid Size:</label>
            <select
              id="grid-size"
              value={gameState.gridSize}
              onChange={e => handleGridSizeChange(Number(e.target.value))}
              disabled={gameMode === 'playing' || gameMode === 'generating'}
            >
              {Array.from(
                {
                  length: GAME_CONFIG.maxGridSize - GAME_CONFIG.minGridSize + 1,
                },
                (_, i) => GAME_CONFIG.minGridSize + i
              ).map(size => (
                <option key={size} value={size}>
                  {size}×{size}
                </option>
              ))}
            </select>
          </div>
          <button
            className="new-puzzle-btn"
            onClick={handleNewPuzzle}
            disabled={gameMode === 'generating'}
          >
            {gameMode === 'generating' ? 'Generating...' : 'New Puzzle'}
          </button>
        </div>
      </header>

      <div className="game-content">
        <div className="game-info">
          <Timer
            isRunning={gameMode === 'playing'}
            startTime={gameState.startTime}
            endTime={gameState.endTime}
          />
          {gameState.isCompleted && (
            <div className="completion-message">
              <h2>Puzzle Complete! 🎉</h2>
              <p>Time: {Math.floor(getCompletionTime() / 1000)}s</p>
            </div>
          )}
        </div>

        <div className="game-board">
          {gameMode === 'generating' && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <p>
                Generating {gameState.gridSize}×{gameState.gridSize} puzzle...
                {gameState.gridSize >= 6 && (
                  <>
                    <br />
                    <small>Using optimized algorithm for fast generation</small>
                  </>
                )}
              </p>
            </div>
          )}

          {gameState.puzzle && (
            <Grid
              puzzle={gameState.puzzle}
              currentPath={gameState.currentPath}
              onPathUpdate={handlePathUpdate}
              onComplete={handleGameComplete}
              disabled={gameMode !== 'playing'}
            />
          )}

          {gameMode === 'idle' && (
            <div className="welcome-message">
              <h2>Welcome to Zip Puzzle!</h2>
              <p>
                Connect the numbered dots in order by drawing a continuous path
                that fills the entire grid.
              </p>
              <button className="start-btn" onClick={handleNewPuzzle}>
                Start Playing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game;
