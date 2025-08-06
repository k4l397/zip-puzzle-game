🧩 Zip Puzzle Game – Product Requirements Document (PRD)
1. Product Overview
This project is a personal web-based game inspired by LinkedIn’s Zip puzzle. The goal is to give the player unlimited access to procedurally generated puzzles, so they can improve their skills and outperform a friend.

Players are presented with a grid containing numbered dots. The objective is to draw a single continuous pipe through every cell in the grid, connecting the dots in strict numerical order (e.g., 1 → 2 → 3...), without overlaps or gaps. The puzzle must fill the grid completely.

2. Goals & Success Criteria
Goals
Create a playable, touch-friendly web version of Zip.

Allow unlimited puzzle play through random generation.

Ensure all puzzles are solvable.

Provide a natural drag-and-drop interface for drawing paths.

Track and display player completion time.

Success Criteria
Game works across desktop and mobile browsers.

Puzzles are always valid and solvable.

Drawing UI feels fluid and intuitive.

Game tracks completion time and displays it on win.

Local state management (no server needed).

3. Gameplay Mechanics
Rules
A grid of n x n cells is presented.

y numbered dots are placed on the grid.

Player must draw a single, unbroken pipe that:

Connects the dots in strict ascending order.

Fills all grid cells without overlaps or crossing.

Pipes can only move orthogonally (no diagonals).

Player cannot delete pipe segments, but can drag back through placed cells to reverse the path.

Puzzles are only considered complete when the full path is correct and the grid is fully covered.

4. Puzzle Generation
Core Requirements
Puzzle generator runs client-side.

Must dynamically generate valid puzzles of arbitrary size and complexity.

Dot count (y) scales with grid size (n).

Dot sequence may be randomized, but must have a valid path.

Puzzles are verified for solvability before being presented.

Approach (for implementation)
Use a backtracking depth-first search (DFS) or A* search to generate and/or verify puzzle solutions.

One possible method:

Start with an empty n x n grid.

Use DFS to build a valid Hamiltonian path that touches every square.

Select y evenly spaced points along the path and assign ascending numbers (1 → y).

Store the solution path for validation/testing purposes.

⚠️ Generating valid puzzles is the most complex part of the project. This step may require multiple iterations to tune performance and ensure consistent results.

5. User Interface / UX
Core Interactions
Drag from dot to extend pipe through grid.

Drag backwards to undo.

Pipes "snap" into grid cells.

Dots are shown as numbered nodes.

On puzzle completion, show timer and success message.

UI Features
Dynamic grid rendering (n x n).

Minimalist and clean design.

Button to "New Puzzle".

Timer (stopwatch starts on first interaction, ends on win).

Optional dropdown to select grid size and difficulty.

Devices & Input
Full support for:

Mouse (desktop)

Touch (mobile/tablet)

Grid adjusts to screen size (responsive layout).

6. Technical Specifications
Stack
Frontend Framework: React

Build Tool: Vite

Language: TypeScript

Storage: localStorage or sessionStorage for optional persistence (e.g., grid size preference).

Architecture
Components:

Game: Overall game wrapper

Grid: Renders the board

Cell: Individual squares

Dot: Numbered start/endpoints

Pipe: Visual path renderer

Timer: Stopwatch display

Generator: Logic for generating valid puzzles

7. Non-Functional Requirements
Fast load time (under 2 seconds)

Works in offline mode (optional enhancement)

Touch responsiveness: ~16ms update cycle

Accessibility:

High contrast visuals

Keyboard navigation (optional)

No data collection or analytics required

8. Out of Scope (for now)
No user accounts or multiplayer

No server-side code or persistent back-end

No scoring, leaderboard, or achievements

No daily challenge / social sharing

9. Future Enhancements (Optional Ideas)
Difficulty levels (limit backtracking, increase twists)

UI themes

Sound effects or animations

Save best times

Cloud sync and profile tracking


SEE zip.png for an idea what it might look like.
