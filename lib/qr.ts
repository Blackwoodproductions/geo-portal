// Minimal QR Code Generator — ported from generate-portal-qr edge function

export function generateQRSvg(text: string, size = 256): string {
  const modules = encodeQR(text);
  const moduleCount = modules.length;
  const cellSize = size / moduleCount;

  let paths = '';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row][col]) {
        const x = col * cellSize;
        const y = row * cellSize;
        const r = cellSize * 0.15;
        paths += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${r}" ry="${r}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d946ef;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#0a0a0a" rx="12" ry="12"/>
  <g fill="url(#qrGrad)">${paths}</g>
  <text x="${size / 2}" y="${size - 6}" text-anchor="middle" fill="#d946ef" font-family="monospace" font-size="8" opacity="0.6">GEO PORTAL</text>
</svg>`;
}

function encodeQR(text: string): boolean[][] {
  const version = text.length <= 25 ? 2 : text.length <= 47 ? 3 : text.length <= 78 ? 4 : text.length <= 114 ? 5 : 6;
  const size = version * 4 + 17;

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, size - 7, 0);
  placeFinder(matrix, reserved, 0, size - 7);

  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0; reserved[6][i] = true; }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0; reserved[i][6] = true; }
  }

  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    for (const r of positions) {
      for (const c of positions) {
        if (!reserved[r]?.[c] && matrix[r]?.[c] === null) {
          placeAlignment(matrix, reserved, r, c);
        }
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    if (i < size) reserved[8][i] = true;
    if (i < size) reserved[i][8] = true;
    if (size - 1 - i >= 0) reserved[8][size - 1 - i] = true;
    if (size - 1 - i >= 0) reserved[size - 1 - i][8] = true;
  }
  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;

  const dataBits = encodeDataBits(text, version);

  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5;
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const dc of [0, -1]) {
        const c = col + dc;
        if (c < 0 || c >= size) continue;
        if (reserved[row][c]) continue;
        matrix[row][c] = bitIdx < dataBits.length ? dataBits[bitIdx] === 1 : false;
        bitIdx++;
      }
    }
    upward = !upward;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && (r + c) % 2 === 0) {
        matrix[r][c] = !matrix[r][c];
      }
    }
  }

  placeFormatInfo(matrix, size, 0);
  return matrix.map(row => row.map(cell => cell === true));
}

function placeFinder(matrix: (boolean | null)[][], reserved: boolean[][], startR: number, startC: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = startR + r, cc = startC + c;
      if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) continue;
      const isOuter = r === -1 || r === 7 || c === -1 || c === 7;
      const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      matrix[rr][cc] = !isOuter && (isBorder || isInner);
      reserved[rr][cc] = true;
    }
  }
}

function placeAlignment(matrix: (boolean | null)[][], reserved: boolean[][], centerR: number, centerC: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = centerR + r, cc = centerC + c;
      if (rr < 0 || cc < 0 || rr >= matrix.length || cc >= matrix.length) continue;
      if (reserved[rr][cc]) continue;
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[rr][cc] = isBorder || isCenter;
      reserved[rr][cc] = true;
    }
  }
}

function getAlignmentPositions(version: number): number[] {
  const intervals: Record<number, number[]> = {
    2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
    7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  };
  return intervals[version] || [6, 18];
}

function encodeDataBits(text: string, version: number): number[] {
  const bits: number[] = [];
  bits.push(0, 1, 0, 0);
  const len = text.length;
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
  }
  for (let i = 0; i < 4; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const totalDataBytes = getDataCapacity(version);
  while (bits.length < totalDataBytes * 8) {
    bits.push(1, 1, 1, 0, 1, 1, 0, 0);
    if (bits.length < totalDataBytes * 8) bits.push(0, 0, 0, 1, 0, 0, 0, 1);
  }
  return bits.slice(0, totalDataBytes * 8);
}

function getDataCapacity(version: number): number {
  const caps: Record<number, number> = {
    1: 19, 2: 34, 3: 55, 4: 80, 5: 108, 6: 136, 7: 156, 8: 194, 9: 232, 10: 274,
  };
  return caps[version] || 34;
}

function placeFormatInfo(matrix: (boolean | null)[][], size: number, mask: number) {
  const formatStrings: Record<number, string> = {
    0: '111011111000100', 1: '111001011110011', 2: '111110110101010', 3: '111100010011101',
    4: '110011000101111', 5: '110001100011000', 6: '110110001000001', 7: '110100101110110',
  };
  const fmt = formatStrings[mask] || formatStrings[0];
  const positions1 = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];
  for (let i = 0; i < 15; i++) {
    matrix[positions1[i][0]][positions1[i][1]] = fmt[i] === '1';
  }
  const positions2 = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
  ];
  for (let i = 0; i < 15; i++) {
    if (positions2[i][0] < size && positions2[i][1] < size) {
      matrix[positions2[i][0]][positions2[i][1]] = fmt[i] === '1';
    }
  }
}
