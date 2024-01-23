import { TPiece, TPieceCollection, TPieceCoord } from "./types"

const buildAPiece = (a1: number, b1: number, a2: number, b2: number, a3: number, b3: number, a4: number, b4: number): TPiece => {
    return [[a1, b1], [a2, b2], [a3, b3], [a4, b4]]
}


export function definePieceShapes(): TPieceCollection {
    const IPiece = buildAPiece(-1, 0, 0, 0, 1, 0, 2, 0)
    const JPiece = buildAPiece(-1, -1, -1, 0, 0, 0, 1, 0)
    const LPiece = buildAPiece(1, -1, -1, 0, 0, 0, 1, 0)
    const OPiece = buildAPiece(0, -1, 1, -1, 0, 0, 1, 0)
    const SPiece = buildAPiece(0, -1, 1, -1, -1, 0, 0, 0)
    const TTPiece = buildAPiece(0, -1, -1, 0, 0, 0, 1, 0)
    const ZPiece = buildAPiece(-1, -1, 0, -1, 0, 0, 1, 0)
    return { IPiece, JPiece, LPiece, OPiece, SPiece, TTPiece, ZPiece }
}

function rotateCoord([x, y]: TPieceCoord): TPieceCoord {
    return [y === 0 ? 0 : -y, x];
}

export function rotatePiece(piece: TPiece): TPiece {
    const rotatedPiece = piece.map(coord => rotateCoord(coord)) as TPiece;
    return rotatedPiece;
}

export function erasePiece(piece: TPiece, position: [number, number]) {
    piece.forEach(block => {
        const x = block[0] + position[0]
        const y = block[1] + position[1]
        const el = document.querySelector('.cellIndex-' + x + '-' + y);
        el?.classList.remove('grid-cell-active');
      })
}

export function activatePiece(piece: TPiece, position: [number, number]) {
    piece.forEach(block => {
        const x = block[0] + position[0]
        const y = block[1] + position[1]
        const el = document.querySelector('.cellIndex-' + x + '-' + y);
        el?.classList.add('grid-cell-active');
      })
}