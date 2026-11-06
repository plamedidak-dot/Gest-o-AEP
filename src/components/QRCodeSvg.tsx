import React from 'react';

// Generates a deterministic SVG QR code pattern based on input data
export const QRCodeSvg: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 120,
  className = '',
}) => {
  // Simple deterministic pseudo-hash to produce a realistic matrix QR grid
  const hash = (str: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return Math.abs(h);
  };

  const gridSize = 21; // Standard Version 1 QR code size
  const seed = hash(value);

  // Build matrix
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Finder patterns at corners (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(gridSize - 7, 0); // Top-right
  drawFinder(0, gridSize - 7); // Bottom-left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Populate remaining cells based on data hash
  let currentSeed = seed;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finder patterns or timing lines
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= gridSize - 8;
      const inFinder3 = r >= gridSize - 8 && c < 8;
      const isTiming = (r === 6 && c >= 8 && c < gridSize - 8) || (c === 6 && r >= 8 && r < gridSize - 8);

      if (!inFinder1 && !inFinder2 && !inFinder3 && !isTiming) {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
        matrix[r][c] = (currentSeed % 3) !== 0;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`bg-white p-1 rounded ${className}`}
      aria-label={`Código QR para ${value}`}
    >
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
};
