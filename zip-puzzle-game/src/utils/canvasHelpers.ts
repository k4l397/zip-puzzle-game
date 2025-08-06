import type { Position } from '../types/game';
import { GAME_CONFIG, CANVAS_CONFIG } from '../constants/config';

/**
 * Canvas utility functions for drawing game elements
 */
export class CanvasHelpers {
  private ctx: CanvasRenderingContext2D;
  private gridSize: number;

  constructor(ctx: CanvasRenderingContext2D, gridSize: number) {
    this.ctx = ctx;
    this.gridSize = gridSize;
  }

  /**
   * Convert grid coordinates to canvas pixel coordinates
   */
  public gridToCanvas(gridPos: Position): Position {
    return {
      x: gridPos.x * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding,
      y: gridPos.y * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding,
    };
  }

  /**
   * Convert canvas pixel coordinates to grid coordinates
   */
  public canvasToGrid(canvasPos: Position): Position {
    return {
      x: Math.round((canvasPos.x - CANVAS_CONFIG.padding) / GAME_CONFIG.cellSize),
      y: Math.round((canvasPos.y - CANVAS_CONFIG.padding) / GAME_CONFIG.cellSize),
    };
  }

  /**
   * Draw a smooth rounded rectangle
   */
  public drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Draw a circle with optional border
   */
  public drawCircle(
    center: Position,
    radius: number,
    fillColor?: string,
    strokeColor?: string,
    strokeWidth?: number
  ): void {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);

    if (fillColor) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
    }

    if (strokeColor && strokeWidth) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.stroke();
    }
  }

  /**
   * Draw text with custom styling
   */
  public drawText(
    text: string,
    position: Position,
    options: {
      font?: string;
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      maxWidth?: number;
    } = {}
  ): void {
    const {
      font = '14px -apple-system, BlinkMacSystemFont, sans-serif',
      fillColor = '#000000',
      strokeColor,
      strokeWidth = 1,
      align = 'center',
      baseline = 'middle',
      maxWidth,
    } = options;

    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    if (strokeColor && strokeWidth > 0) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeText(text, position.x, position.y, maxWidth);
    }

    this.ctx.fillStyle = fillColor;
    this.ctx.fillText(text, position.x, position.y, maxWidth);
  }

  /**
   * Draw a smooth path through multiple points
   */
  public drawSmoothPath(
    points: Position[],
    options: {
      strokeColor?: string;
      strokeWidth?: number;
      lineCap?: CanvasLineCap;
      lineJoin?: CanvasLineJoin;
      smooth?: boolean;
    } = {}
  ): void {
    if (points.length < 2) return;

    const {
      strokeColor = GAME_CONFIG.colors.pipe,
      strokeWidth = GAME_CONFIG.pipeWidth,
      lineCap = 'round',
      lineJoin = 'round',
      smooth = true,
    } = options;

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = lineCap;
    this.ctx.lineJoin = lineJoin;

    this.ctx.beginPath();
    const canvasPoints = points.map(p => this.gridToCanvas(p));

    if (!smooth || canvasPoints.length < 3) {
      // Simple path
      this.ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
      for (let i = 1; i < canvasPoints.length; i++) {
        this.ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
      }
    } else {
      // Smooth path with curves
      this.ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);

      for (let i = 1; i < canvasPoints.length - 1; i++) {
        const current = canvasPoints[i];
        const next = canvasPoints[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;

        this.ctx.quadraticCurveTo(current.x, current.y, midX, midY);
      }

      // Final point
      const lastPoint = canvasPoints[canvasPoints.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    this.ctx.stroke();
  }

  /**
   * Draw grid lines
   */
  public drawGrid(
    options: {
      strokeColor?: string;
      strokeWidth?: number;
      alpha?: number;
    } = {}
  ): void {
    const {
      strokeColor = GAME_CONFIG.colors.grid,
      strokeWidth = CANVAS_CONFIG.gridLineWidth,
      alpha = 1,
    } = options;

    const oldAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;

    const totalSize = this.gridSize * GAME_CONFIG.cellSize;

    // Vertical lines
    for (let i = 0; i <= this.gridSize; i++) {
      const x = i * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding;
      this.ctx.beginPath();
      this.ctx.moveTo(x, CANVAS_CONFIG.padding);
      this.ctx.lineTo(x, totalSize + CANVAS_CONFIG.padding);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= this.gridSize; i++) {
      const y = i * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding;
      this.ctx.beginPath();
      this.ctx.moveTo(CANVAS_CONFIG.padding, y);
      this.ctx.lineTo(totalSize + CANVAS_CONFIG.padding, y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = oldAlpha;
  }

  /**
   * Draw a highlighted cell
   */
  public drawHighlightedCell(
    gridPos: Position,
    options: {
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      alpha?: number;
    } = {}
  ): void {
    const {
      fillColor = 'rgba(37, 99, 235, 0.1)',
      strokeColor = GAME_CONFIG.colors.pipe,
      strokeWidth = 2,
      alpha = 1,
    } = options;

    const canvasPos = this.gridToCanvas(gridPos);
    const oldAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;

    // Draw cell background
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(
      canvasPos.x - GAME_CONFIG.cellSize / 2,
      canvasPos.y - GAME_CONFIG.cellSize / 2,
      GAME_CONFIG.cellSize,
      GAME_CONFIG.cellSize
    );

    // Draw cell border
    if (strokeColor && strokeWidth > 0) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeRect(
        canvasPos.x - GAME_CONFIG.cellSize / 2,
        canvasPos.y - GAME_CONFIG.cellSize / 2,
        GAME_CONFIG.cellSize,
        GAME_CONFIG.cellSize
      );
    }

    this.ctx.globalAlpha = oldAlpha;
  }

  /**
   * Draw an animated dot (for pulse effect)
   */
  public drawAnimatedDot(
    gridPos: Position,
    number: number,
    options: {
      baseRadius?: number;
      pulseAmount?: number;
      animationProgress?: number;
      fillColor?: string;
      strokeColor?: string;
      textColor?: string;
    } = {}
  ): void {
    const {
      baseRadius = GAME_CONFIG.dotRadius,
      pulseAmount = 3,
      animationProgress = 0,
      fillColor = GAME_CONFIG.colors.dot,
      strokeColor = 'white',
      textColor = GAME_CONFIG.colors.dotText,
    } = options;

    const canvasPos = this.gridToCanvas(gridPos);
    const pulseRadius = baseRadius + Math.sin(animationProgress * Math.PI * 2) * pulseAmount;

    this.drawCircle(canvasPos, pulseRadius, fillColor, strokeColor, CANVAS_CONFIG.dotBorderWidth);

    this.drawText(number.toString(), canvasPos, {
      font: 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif',
      fillColor: textColor,
      align: 'center',
      baseline: 'middle',
    });
  }

  /**
   * Clear the entire canvas
   */
  public clear(): void {
    const totalSize = this.gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2;
    this.ctx.clearRect(0, 0, totalSize, totalSize);
  }

  /**
   * Set up high DPI rendering
   */
  public static setupHighDPI(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);

    return dpr;
  }

  /**
   * Get optimal canvas size for grid
   */
  public static getOptimalCanvasSize(gridSize: number): { width: number; height: number } {
    const totalSize = gridSize * GAME_CONFIG.cellSize + CANVAS_CONFIG.padding * 2;
    return { width: totalSize, height: totalSize };
  }

  /**
   * Create gradient for visual effects
   */
  public createRadialGradient(
    center: Position,
    innerRadius: number,
    outerRadius: number,
    colorStops: Array<{ offset: number; color: string }>
  ): CanvasGradient {
    const gradient = this.ctx.createRadialGradient(
      center.x, center.y, innerRadius,
      center.x, center.y, outerRadius
    );

    colorStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });

    return gradient;
  }

  /**
   * Draw a path segment with direction indicator
   */
  public drawDirectionalPath(
    from: Position,
    to: Position,
    options: {
      strokeColor?: string;
      strokeWidth?: number;
      arrowSize?: number;
      showArrow?: boolean;
    } = {}
  ): void {
    const {
      strokeColor = GAME_CONFIG.colors.pipe,
      strokeWidth = GAME_CONFIG.pipeWidth,
      arrowSize = 8,
      showArrow = false,
    } = options;

    const fromCanvas = this.gridToCanvas(from);
    const toCanvas = this.gridToCanvas(to);

    // Draw line
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(fromCanvas.x, fromCanvas.y);
    this.ctx.lineTo(toCanvas.x, toCanvas.y);
    this.ctx.stroke();

    // Draw arrow if requested
    if (showArrow) {
      const angle = Math.atan2(toCanvas.y - fromCanvas.y, toCanvas.x - fromCanvas.x);
      const arrowX = toCanvas.x - Math.cos(angle) * strokeWidth;
      const arrowY = toCanvas.y - Math.sin(angle) * strokeWidth;

      this.ctx.fillStyle = strokeColor;
      this.ctx.beginPath();
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      this.ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
}

/**
 * Utility functions for canvas operations
 */
export const canvasUtils = {
  /**
   * Get mouse/touch position relative to canvas
   */
  getRelativePosition(event: MouseEvent | Touch, canvas: HTMLCanvasElement): Position {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  },

  /**
   * Check if position is within canvas bounds
   */
  isWithinCanvas(pos: Position, canvas: HTMLCanvasElement): boolean {
    return pos.x >= 0 && pos.x <= canvas.width && pos.y >= 0 && pos.y <= canvas.height;
  },

  /**
   * Clamp position to canvas bounds
   */
  clampToCanvas(pos: Position, canvas: HTMLCanvasElement): Position {
    return {
      x: Math.max(0, Math.min(pos.x, canvas.width)),
      y: Math.max(0, Math.min(pos.y, canvas.height)),
    };
  },

  /**
   * Calculate distance between two positions
   */
  distance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Linear interpolation between two positions
   */
  lerp(pos1: Position, pos2: Position, t: number): Position {
    return {
      x: pos1.x + (pos2.x - pos1.x) * t,
      y: pos1.y + (pos2.y - pos1.y) * t,
    };
  },

  /**
   * Create canvas element with proper attributes
   */
  createCanvas(width: number, height: number, className?: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    if (className) {
      canvas.className = className;
    }

    // Set up touch and accessibility attributes
    canvas.setAttribute('touch-action', 'none');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Zip puzzle game board');

    return canvas;
  },
};
