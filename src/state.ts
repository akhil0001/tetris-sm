import { MachineConfig, createContext, createEvents, createStates } from "@simple-state-machine/core";
import Hammer from "hammerjs";
import { TPiece, TPieceCollection } from "./types";
import { activatePiece, checkForRowFill, createBoard, definePieceShapes, erasePiece, pickRandomPiece, rotatePiece, shiftFilledCells, updateBoardState, blinkPieces, reconstructBoard, removeBlinkPieces, animateGameComplete, returnFuturePositionOnHardDrop, setStartPosition, eraseNextPiece, setUpNextPieceDisplay } from "./actions";

const hammer = new Hammer(document.body)

interface IContext {
    boardState: string[][],
    piece: TPiece,
    pieceName: keyof TPieceCollection,
    gameDims: {
        rows: number,
        columns: number
    },
    position: [number, number],
    futurePosition: [number, number],
    futurePieceAfterRotation: TPiece,
    direction: 'bottom' | 'left' | 'right' | 'setByDefault',
    filledColIndexes: number[],
    score: number,
    shouldAccelerate: boolean,
    nextPiece: keyof TPieceCollection
}

const pieces = definePieceShapes();


const states = createStates('idle', 'playing', 'checkForCollision', 'checkForRowFill', 'filledAnimation', 'paused', 'gameCompleteAnimation');

const events = createEvents('ROTATE_PIECE', 'UPDATE_BOARD_STATE', 'MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_DOWN', 'MOVE_DOWN_FROM_ENGINE', 'PLAY', 'COLLISION_DETECTED', 'COLLISION_UN_DETECTED', 'GENERATE_NEW_PIECE', 'CHECK_FOR_ROW_FILL', 'UPDATE_FILLED_COL_INDEXES', "GAME_COMPLETE", 'PAUSE', 'HARD_DROP', 'DECELERATE');

const randomPiece = pickRandomPiece(pieces)


const context: IContext = createContext({
    boardState: [[]],
    pieceName: randomPiece,
    piece: pieces[randomPiece] as TPiece,
    futurePieceAfterRotation: pieces[randomPiece],
    position: [0, 0],
    gameDims: {
        rows: 20,
        columns: 10
    },
    futurePosition: [0, 0],
    direction: 'bottom',
    filledColIndexes: [],
    score: 0,
    shouldAccelerate: false,
    nextPiece: pickRandomPiece(pieces)
})

export const tetrisMachine = new MachineConfig<typeof states, IContext, typeof events>(states, context, events);

// eslint-disable-next-line @typescript-eslint/unbound-method
const { whenIn } = tetrisMachine;

tetrisMachine.on('PAUSE').moveTo('paused');

whenIn('paused').on('PLAY')
    .moveTo('playing')

whenIn('idle').invokeCallback((context, callback) => {
    const { gameDims } = context
    const { rows, columns } = gameDims;
    const emptyBoard = createBoard(rows, columns)
    callback({
        type: 'UPDATE_BOARD_STATE',
        data: emptyBoard
    })
})
    .on('UPDATE_BOARD_STATE')
    .moveTo('paused')
    .updateContext({
        boardState: (_, event) => event.data as string[][],
        position: setStartPosition,
        nextPiece: () => pickRandomPiece(pieces)
    })
    .fireAndForget(reconstructBoard)
    .fireAndForget(setUpNextPieceDisplay)

whenIn('idle')
    .on('PLAY')
    .moveTo('playing')

whenIn('checkForCollision')
    .invokeCallback((context, callback) => {
        const { futurePosition, boardState, futurePieceAfterRotation } = context;

        const didPieceTouchFinalCol = futurePieceAfterRotation.some(([x, y]) => boardState[y + futurePosition[1]] == undefined || Object.keys(pieces).includes(boardState[y + futurePosition[1]][x + futurePosition[0]]));

        if (didPieceTouchFinalCol) {
            const didPieceAlsoTouchOGPosition = futurePieceAfterRotation.some(([, y]) => y + futurePosition[1] === 1);
            if (didPieceAlsoTouchOGPosition) {
                callback('GAME_COMPLETE')
            }
            else
                callback('CHECK_FOR_ROW_FILL');
            return;
        }
        const didNotCollide = futurePieceAfterRotation.every(([x, y]) => boardState[futurePosition[1] + y][futurePosition[0] + x] === "0");
        if (didNotCollide) {
            callback('COLLISION_UN_DETECTED')
        }
        else {
            callback('COLLISION_DETECTED')
        }
    })

whenIn('checkForCollision')
    .on('COLLISION_DETECTED')
    .moveTo('playing')
    .updateContext({
        futurePieceAfterRotation: context => context.piece
    })

whenIn('checkForCollision')
    .on('CHECK_FOR_ROW_FILL')
    .moveTo('checkForRowFill')
    .updateContext({
        boardState: updateBoardState
    })

whenIn('checkForCollision')
    .on('COLLISION_UN_DETECTED')
    .moveTo('playing')
    .fireAndForget(erasePiece)
    .updateContext({
        position: context => [...context.futurePosition],
        piece: context => [...context.futurePieceAfterRotation]
    })
    .fireAndForget(activatePiece);

whenIn('checkForCollision').on('GAME_COMPLETE')
    .moveTo('gameCompleteAnimation')
    .fireAndForget(animateGameComplete)

whenIn('checkForRowFill').invokeCallback((context, callback) => {
    const { boardState } = context;
    const filledColIndexes = checkForRowFill(boardState);
    if (filledColIndexes.length > 0) {
        callback({
            type: 'UPDATE_FILLED_COL_INDEXES',
            data: {
                filledColIndexes: filledColIndexes
            }
        })
    }
    else {
        callback('GENERATE_NEW_PIECE')
    }
})

whenIn('checkForRowFill').on('GENERATE_NEW_PIECE')
    .moveTo('playing')
    .updateContext({
        piece: (context) => pieces[context.nextPiece],
        pieceName: context => context.nextPiece,
        position: setStartPosition,
        futurePosition: setStartPosition,
        futurePieceAfterRotation: context => pieces[context.nextPiece],
        direction: 'setByDefault',
        shouldAccelerate: false
    })
    .fireAndForget(eraseNextPiece)
    .updateContext({
        nextPiece: () => pickRandomPiece(pieces)
    })
    .fireAndForget(setUpNextPieceDisplay)

whenIn('checkForRowFill').on('UPDATE_FILLED_COL_INDEXES')
    .moveTo('filledAnimation')
    .updateContext({
        filledColIndexes: (_, event) => event.data.filledColIndexes as number[]
    })
    .fireAndForget(context => {
        blinkPieces(context.filledColIndexes)
    })

whenIn('filledAnimation').after(1000)
    .moveTo('playing')
    .updateContext({
        piece: context => pieces[context.nextPiece],
        position: setStartPosition,
        shouldAccelerate: false
    })
    .fireAndForget(eraseNextPiece)
    .updateContext({
        nextPiece: () => pickRandomPiece(pieces)
    })
    .fireAndForget(setUpNextPieceDisplay)
    .fireAndForget(removeBlinkPieces)
    .updateContext({
        filledColIndexes: [],
        boardState: context => shiftFilledCells(context.boardState, context.filledColIndexes, context.gameDims.columns),
        score: context => context.score + context.filledColIndexes.length,
        futurePieceAfterRotation: context => context.piece
    })
    .fireAndForget(reconstructBoard)


whenIn('playing').invokeCallback((_, callback) => {
    const moveLeft = () => callback('MOVE_LEFT');
    const moveRight = () => callback('MOVE_RIGHT');
    const moveDown = () => callback('MOVE_DOWN');
    const rotate = () => callback('ROTATE_PIECE');
    const hardDrop = () => callback('HARD_DROP');
    const keyDownListener = (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft') {
            moveLeft()
        }
        if (e.code === 'ArrowRight') {
            moveRight()
        }
        if (e.code === 'ArrowDown') {
            moveDown()
        }
        if (e.code === 'ArrowUp') {
            rotate()
        }
        if (e.code === 'Space') {
            hardDrop()
        }
    }
    hammer.on('swipeleft', moveLeft)
    hammer.on('swiperight', moveRight)
    hammer.on('swipeup', rotate)
    hammer.on('swipedown', hardDrop)
    hammer.on('tap', moveDown)
    const keyUpListener = () => callback('DECELERATE')
    document.body.addEventListener('keydown', keyDownListener)
    document.body.addEventListener('keyup', keyUpListener)
    return () => {
        document.body.removeEventListener('keydown', keyDownListener)
        document.body.removeEventListener('keyup', keyUpListener)
        hammer.off('swipeleft', moveLeft)
        hammer.off('swiperight', moveRight)
        hammer.off('swipeup', rotate)
        hammer.off('swipedown', hardDrop)
        hammer.off('tap', moveDown)
    }
})

whenIn('playing').on('DECELERATE')
    .updateContext({
        shouldAccelerate: false,
        direction: 'setByDefault'
    })

whenIn('playing').on('MOVE_LEFT')
    .moveTo('checkForCollision')
    .updateContext({
        futurePosition: context => [context.position[0] - 1, context.position[1]],
        direction: 'left',
        shouldAccelerate: true
    })

whenIn('playing').on('MOVE_RIGHT')
    .moveTo('checkForCollision')
    .updateContext({
        futurePosition: context => [context.position[0] + 1, context.position[1]],
        direction: 'right',
        shouldAccelerate: true
    })

whenIn('playing').on('MOVE_DOWN')
    .moveTo('checkForCollision')
    .updateContext({
        futurePosition: context => [context.position[0], context.position[1] + 1],
        direction: 'bottom',
        shouldAccelerate: true
    })

whenIn('playing').on('MOVE_DOWN_FROM_ENGINE')
    .moveTo('checkForCollision')
    .updateContext({
        futurePosition: context => [context.position[0], context.position[1] + 1],
        direction: 'setByDefault',
    })

whenIn('playing').on('HARD_DROP')
    .moveTo('checkForCollision')
    .updateContext({
        futurePosition: returnFuturePositionOnHardDrop,
        direction: 'bottom',
        shouldAccelerate: false
    })


whenIn('playing')
    .on('ROTATE_PIECE')
    .moveTo('checkForCollision')
    .updateContext({
        futurePieceAfterRotation: (context) => context.piece === pieces['OPiece'] ? context.piece : rotatePiece(context.piece),
    })

whenIn('gameCompleteAnimation').after(context => (context.gameDims.rows * 100) + 1000)
    .moveTo('idle')