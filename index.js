import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Trophy, Apple, Zap } from 'lucide-react';

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(150);

  // Game configuration
  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 400;

  // Game objects
  const gameObjects = useRef({
    snake: [{ x: 200, y: 200 }],
    direction: { x: GRID_SIZE, y: 0 },
    food: { x: 100, y: 100 },
    lastDirection: { x: GRID_SIZE, y: 0 }
  });

  const generateFood = useCallback(() => {
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE) - 1;
    const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE) - 1;
    
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * maxX) * GRID_SIZE,
        y: Math.floor(Math.random() * maxY) * GRID_SIZE
      };
    } while (gameObjects.current.snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    ));
    
    gameObjects.current.food = newFood;
  }, []);

  const resetGame = () => {
    gameObjects.current = {
      snake: [{ x: 200, y: 200 }],
      direction: { x: GRID_SIZE, y: 0 },
      food: { x: 100, y: 100 },
      lastDirection: { x: GRID_SIZE, y: 0 }
    };
    setScore(0);
    setSpeed(150);
    generateFood();
  };

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;

      const { direction, lastDirection } = gameObjects.current;
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (lastDirection.y === 0) {
            gameObjects.current.direction = { x: 0, y: -GRID_SIZE };
          }
          break;
        case 'arrowdown':
        case 's':
          if (lastDirection.y === 0) {
            gameObjects.current.direction = { x: 0, y: GRID_SIZE };
          }
          break;
        case 'arrowleft':
        case 'a':
          if (lastDirection.x === 0) {
            gameObjects.current.direction = { x: -GRID_SIZE, y: 0 };
          }
          break;
        case 'arrowright':
        case 'd':
          if (lastDirection.x === 0) {
            gameObjects.current.direction = { x: GRID_SIZE, y: 0 };
          }
          break;
        case ' ':
          e.preventDefault();
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    const { snake, direction, food } = gameObjects.current;

    // Update last direction
    gameObjects.current.lastDirection = { ...direction };

    // Move snake
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Wrap around walls
    if (head.x < 0) head.x = CANVAS_WIDTH - GRID_SIZE;
    if (head.x >= CANVAS_WIDTH) head.x = 0;
    if (head.y < 0) head.y = CANVAS_HEIGHT - GRID_SIZE;
    if (head.y >= CANVAS_HEIGHT) head.y = 0;

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameState('gameOver');
      if (score > highScore) {
        setHighScore(score);
      }
      return;
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      setScore(prev => prev + 10);
      generateFood();
      // Increase speed slightly
      setSpeed(prev => Math.max(80, prev - 2));
    } else {
      // Remove tail if no food eaten
      snake.pop();
    }

    // Draw game
    drawGame(ctx);
  }, [gameState, score, highScore, generateFood]);

  const drawGame = (ctx) => {
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw snake
    const { snake } = gameObjects.current;
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Snake head
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        // Eyes
        ctx.fillStyle = '#000';
        const eyeSize = 3;
        const eyeOffset = 5;
        if (gameObjects.current.direction.x > 0) {
          // Moving right
          ctx.fillRect(segment.x + GRID_SIZE - eyeOffset, segment.y + 4, eyeSize, eyeSize);
          ctx.fillRect(segment.x + GRID_SIZE - eyeOffset, segment.y + GRID_SIZE - 7, eyeSize, eyeSize);
        } else if (gameObjects.current.direction.x < 0) {
          // Moving left
          ctx.fillRect(segment.x + 2, segment.y + 4, eyeSize, eyeSize);
          ctx.fillRect(segment.x + 2, segment.y + GRID_SIZE - 7, eyeSize, eyeSize);
        } else if (gameObjects.current.direction.y > 0) {
          // Moving down
          ctx.fillRect(segment.x + 4, segment.y + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(segment.x + GRID_SIZE - 7, segment.y + GRID_SIZE - eyeOffset, eyeSize, eyeSize);
        } else {
          // Moving up
          ctx.fillRect(segment.x + 4, segment.y + 2, eyeSize, eyeSize);
          ctx.fillRect(segment.x + GRID_SIZE - 7, segment.y + 2, eyeSize, eyeSize);
        }
      } else {
        // Snake body
        const intensity = Math.max(0.3, 1 - (index * 0.1));
        ctx.fillStyle = `rgba(34, 197, 94, ${intensity})`;
        ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      }
    });

    // Draw food
    const { food } = gameObjects.current;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x + 2, food.y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
    
    // Food highlight
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(food.x + 4, food.y + 4, GRID_SIZE - 12, GRID_SIZE - 12);
  };

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, speed);
    } else {
      clearInterval(gameLoopRef.current);
    }

    return () => clearInterval(gameLoopRef.current);
  }, [gameState, gameLoop, speed]);

  const getSpeedLevel = () => {
    return Math.floor((150 - speed) / 10) + 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden max-w-md w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Snake Game
            </h1>
            <div className="text-right">
              <div className="text-sm opacity-80">Speed Level</div>
              <div className="font-mono text-lg">{getSpeedLevel()}</div>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="bg-gray-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-red-400" />
            <span className="font-mono text-xl">Score: {score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-mono">Best: {highScore}</span>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative bg-black">
          {gameState === 'menu' && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center text-white p-8">
                <div className="text-6xl mb-4">🐍</div>
                <h2 className="text-3xl font-bold mb-4">Snake Game</h2>
                <p className="mb-6 text-gray-300">
                  Use WASD or Arrow Keys to move<br/>
                  Eat the red food to grow<br/>
                  Don't hit walls or yourself!
                </p>
                <button
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Game
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center text-white p-8">
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-3xl font-bold mb-4 text-red-400">Game Over!</h2>
                <p className="text-xl mb-2">Final Score: {score}</p>
                {score === highScore && score > 0 && (
                  <p className="text-yellow-400 mb-4">🎉 New High Score!</p>
                )}
                <div className="space-y-2">
                  <button
                    onClick={startGame}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Play Again
                  </button>
                  <button
                    onClick={() => setGameState('menu')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <Pause className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Paused</h2>
                <p className="text-gray-300 mt-2">Press SPACE to resume</p>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block mx-auto"
          />
        </div>

        {/* Controls */}
        <div className="bg-gray-700 p-4">
          <div className="flex justify-center gap-2 mb-3">
            {gameState === 'playing' && (
              <button
                onClick={pauseGame}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {gameState === 'paused' && (
              <button
                onClick={pauseGame}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            {(gameState === 'playing' || gameState === 'paused') && (
              <button
                onClick={() => setGameState('menu')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Menu
              </button>
            )}
          </div>
          
          <div className="text-center text-gray-300 text-sm">
            <p><strong>Controls:</strong> WASD or Arrow Keys • SPACE to pause</p>
            <p>Snake length: {gameObjects.current?.snake?.length || 1}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;