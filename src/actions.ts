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

export function erasePiece({ piece, position }: { piece: TPiece, position: [number, number] }) {
    piece.forEach(block => {
        const x = block[0] + position[0]
        const y = block[1] + position[1]
        const el = document.querySelector('.col-' + x + '.row-' + y);
        el?.classList.remove('grid-cell-active');
    })
}

export function activatePiece({ piece, position }: { piece: TPiece, position: [number, number] }) {
    piece.forEach(block => {
        const x = block[0] + position[0]
        const y = block[1] + position[1]
        const el = document.querySelector('.col-' + x + '.row-' + y);
        el?.classList.add('grid-cell-active');
    })
}

function lerp(x: number, y: number) {
    const rand = Math.random();
    const lerpedNum = x * (1 - rand) + y * rand;
    return Math.round(lerpedNum)
}

export function pickRandomPiece(pieces: TPieceCollection) {
    const pieceKeys = Object.keys(pieces);
    const randomPieceIndex = lerp(0, pieceKeys.length - 1);
    const randomPiece = pieces[pieceKeys[randomPieceIndex] as keyof TPieceCollection]
    return randomPiece
}

export function updateBoardState({ piece, position, boardState }: { piece: TPiece, position: [number, number], boardState: number[][] }) {
    piece.forEach(block => {
        const x = block[0] + position[0]
        const y = block[1] + position[1]
        boardState[y][x] = 1
    })
    return boardState
}

export function checkForRowFill(boardState: number[][]) {
    const filledColIndexes: number[] = [];
    boardState.forEach((col, index) => {
        if (col.every(cell => cell === 1)) {
            filledColIndexes.push(index)
        }
    })
    return filledColIndexes;
}

export function shiftFilledCells(boardState: number[][], filledColIndexes: number[], columns: number) {
    const sortedFilledColIndexes = filledColIndexes.sort((a, b) => b - a);
    const boardWithoutFilledColIndexes = boardState.filter((_, index) => !sortedFilledColIndexes.includes(index));
    let newBoardState = boardWithoutFilledColIndexes;
    filledColIndexes.forEach(() => {
        const emptyRow = [...new Array(columns) as number[]].map(() => 0);
        newBoardState = [emptyRow, ...newBoardState]
    })
    return newBoardState
}

export function createBoard(rows: number, columns: number) {
    const emptyRow = [...new Array(columns) as number[]].map(() => 0);
    const emptyBoard = [...new Array(rows) as number[]].map(() => [...emptyRow]);
    return emptyBoard;
}

export function blinkPieces(filledColIndexes: number[]) {
    filledColIndexes.forEach(index => {
        const allFilledElement = document.querySelectorAll('.row-' + index);
        allFilledElement.forEach(el => el.classList.add('blink'))
    })
}

export function removeBlinkPieces({ filledColIndexes }: { filledColIndexes: number[] }) {
    filledColIndexes.forEach(index => {
        const allFilledElement = document.querySelectorAll('.row-' + index);
        allFilledElement.forEach(el => el.classList.remove('blink'))
    })
}

export function reconstructBoard({ boardState }: { boardState: number[][] }) {
    boardState.forEach((col, colIndex) => {
        col.forEach((cell, rowIndex) => {
            const isActive = cell === 1;
            const gridCell = document.querySelector('.row-' + colIndex + '.col-' + rowIndex) as HTMLElement
            if (isActive) {
                gridCell?.classList.add('grid-cell-active')
            }
            else {
                gridCell?.classList.remove('grid-cell-active')
            }
            gridCell?.classList.remove('delay')
            gridCell.style.transitionDelay = 'initial';
        })
    })
}

export function animateGameComplete({ boardState }: { boardState: number[][] }) {
    boardState.forEach((_, rowIndex) => {
        const gridElements = Array.from(document.getElementsByClassName('row-' + rowIndex) as HTMLCollectionOf<HTMLElement>)
        gridElements.forEach(cell => {
            cell.classList.add('delay')
            cell.style.transitionDelay = 100 * (rowIndex + 1) + "ms"
        })
    })
}

export function returnFuturePositionOnHardDrop({ boardState, piece, position }: { boardState: number[][], piece: TPiece, position: [number, number] }) {
    let futurePosition = position;
    let touchedFinalPosition = false;

    while (!touchedFinalPosition) {
        futurePosition = [futurePosition[0], futurePosition[1] + 1]
        touchedFinalPosition = piece.some(([x, y]) => boardState[y + futurePosition[1] + 1] == undefined || boardState[y + futurePosition[1] + 1][x + futurePosition[0]] === 1);
    }
    return futurePosition
}

export function setStartPosition({ gameDims }: { gameDims: { rows: number, columns: number } }): [number, number] {
    const { columns } = gameDims;
    return [columns / 2 - 1, 1]
}