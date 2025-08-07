# Enhanced Backtracking System

This document explains the enhanced backtracking system implemented in the Zip puzzle game.

## Overview

The enhanced backtracking system provides contextual path backtracking based on numbered dot positions, preventing accidental long-distance backtracking while maintaining intuitive checkpoint behavior.

## How It Works

### Current Behavior vs Enhanced Behavior

**Before (Old System):**
- Intersecting with ANY part of your existing path would backtrack to that point
- Could accidentally send you very far back in large puzzles

**After (Enhanced System):**
- **Contextual backtracking** based on your current position and numbered dots
- Numbered dots act as **checkpoints** that control backtracking scope

### Backtracking Rules

#### Rule 1: Not at a Numbered Dot
When you're drawing between numbered dots, you can only backtrack to positions that came **after** the last numbered dot you passed through (inclusive of the dot itself).

**Example:**
```
Path: 1 → A → B → C → 2 → D → E → F
Current position: F (not on a numbered dot)

✅ Can backtrack to: 2, D, E (positions after/including dot 2)
❌ Cannot backtrack to: 1, A, B, C (positions before dot 2)
```

#### Rule 2: At a Numbered Dot
When you're currently positioned on a numbered dot, you can backtrack to any position back to the **previous numbered dot** (inclusive).

**Example:**
```
Path: 1 → A → B → 2 → C → D → 3
Current position: 3 (on numbered dot 3)

✅ Can backtrack to: 2, C, D (back to previous dot 2)
❌ Cannot backtrack to: 1, A, B (before previous dot 2)
```

#### Rule 3: At Dot 1
When at dot 1, you can backtrack to any position (no restrictions).

## Visual Feedback

The system provides visual cues to help users understand backtracking limitations:

- **Bright colored path segments**: Can be backtracked to
- **Dimmed/grayed path segments**: Cannot be backtracked to
- **Hover effects**: Only appear on backtrackable positions

## Examples

### Example 1: Progressive Backtracking
```
Grid:
┌─────┬─────┬─────┬─────┐
│  1  │  A──┴──B  │  2  │
├─────┼─────────┬─┼─────┤
│     │         │ C──D──┘
├─────┼─────────┼─────┬─┤
│     │    3    │  E──┴F│
└─────┴─────────┴─────┘─┘

Path: 1 → A → B → 2 → C → D → 3 → E → F
```

**Scenario A: Currently at F**
- Can backtrack to: 3, E (after dot 3)
- Cannot backtrack to: 2, C, D, 1, A, B

**Scenario B: Move to dot 3**
- Can backtrack to: 2, C, D (back to previous dot 2)
- Cannot backtrack to: 1, A, B

**Scenario C: Move to dot 2**
- Can backtrack to: 1, A, B (back to previous dot 1)

### Example 2: No Accidental Long Jumps
```
Large puzzle with path: 1 → [many positions] → 2 → [few positions] → current

Old system: Accidentally hitting any early position = long backtrack
New system: Can only hit recent positions after dot 2
```

## Implementation Details

### Key Functions

- `getLastVisitedDot(path)`: Finds the last numbered dot in the current path
- `canBacktrackToPosition(path, target, current)`: Determines if backtracking is allowed
- `getPreviousNumberedDot(dotNumber)`: Gets the previous dot in sequence

### Integration Points

- **Mouse/touch drawing**: Prevents unwanted backtracking during path drawing
- **Click-to-resume**: Only allows resuming from valid backtrack positions
- **Hover effects**: Shows visual feedback for available backtrack positions
- **Visual rendering**: Dims non-backtrackable path segments

## Benefits

1. **Prevents accidental long backtracking** in large puzzles
2. **Maintains intuitive checkpoint behavior** with numbered dots
3. **Clear visual feedback** about what's possible
4. **Progressive backtracking** through numbered dot checkpoints
5. **Preserves existing functionality** while adding intelligence

## Testing

Comprehensive unit tests cover all scenarios:
- No dots visited yet
- Single dot scenarios
- Multiple dot progression
- Context changes when reaching numbered dots
- Edge cases (dot 1, final dots)

Run tests: `npm test enhanced-backtracking.test.ts`
