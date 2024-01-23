import { MachineConfig, createContext, createEvents, createStates } from "@simple-state-machine/core";
import { TPiece } from "./types";
import { activatePiece, checkForCollision, definePieceShapes, erasePiece, pickRandomPiece, rotatePiece } from "./utils";


interface IContext {
    boardState: number[][],
    piece: TPiece,
    gameDims: {
        rows: number,
        columns: number
    },
    position: [number, number],
    futurePosition: [number, number]
}

const pieces = definePieceShapes();

const states = createStates('idle', 'playing', 'checkForCollision');

const events = createEvents('ROTATE_PIECE', 'UPDATE_BOARD_STATE', 'MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_DOWN', 'PLAY', 'COLLISION_DETECTED', 'COLLISION_UN_DETECTED', 'GENERATE_NEW_PIECE')

const context: IContext = createContext({
    boardState: [[]],
    piece: pickRandomPiece(pieces),
    position: [4, 0],
    gameDims: {
        rows: 20,
        columns: 10
    },
    futurePosition: [4, 0]
})

export const tetrisMachine = new MachineConfig<typeof states, IContext, typeof events>(states, context, events);

// eslint-disable-next-line @typescript-eslint/unbound-method
const { whenIn } = tetrisMachine;

whenIn('idle').invokeCallback((context, callback) => {
    const { gameDims } = context
    const { rows, columns } = gameDims;
    const emptyRow = new Array(columns).fill(0).map((el: number) => el);
    const emptyBoard = new Array(rows).fill(0).map(() => emptyRow);
    callback({
        type: 'UPDATE_BOARD_STATE',
        data: emptyBoard
    })
}).on('UPDATE_BOARD_STATE').updateContext({
    boardState: (_, event) => event.data as number[][]
})

whenIn('idle').on('PLAY').moveTo('playing')

whenIn('playing').on('ROTATE_PIECE').fireAndForget(context => {
    erasePiece(context.piece, context.position)
}).updateContext({
    piece: (context) => context.piece === pieces['OPiece'] ? context.piece : rotatePiece(context.piece)
}).fireAndForget(context => activatePiece(context.piece, context.position))


whenIn('checkForCollision').invokeCallback((context, callback) => {
    const { piece, futurePosition, boardState } = context;
    const collided = checkForCollision(piece, futurePosition, boardState);
    if (collided === 'bottom') {
        callback('GENERATE_NEW_PIECE')
    }
    else if(collided === 'side'){
        callback('COLLISION_DETECTED');
    }
    else {
        callback('COLLISION_UN_DETECTED')
    }
})

whenIn('checkForCollision').on('COLLISION_DETECTED').moveTo('playing');
whenIn('checkForCollision').on('GENERATE_NEW_PIECE').moveTo('playing').updateContext({
    piece: () => pickRandomPiece(pieces),
    position: [4,0]
})
whenIn('checkForCollision').on('COLLISION_UN_DETECTED').moveTo('playing').fireAndForget(context => erasePiece(context.piece, context.position)).updateContext({
    position: context => [...context.futurePosition]
}).fireAndForget(context => activatePiece(context.piece, context.position))

whenIn('playing').invokeCallback((_, callback) => {
    const moveLeft = () => callback('MOVE_LEFT');
    const moveRight = () => callback('MOVE_RIGHT');
    const moveDown = () => callback('MOVE_DOWN');
    const rotate = () => callback('ROTATE_PIECE');
    const keyDownListener = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            moveLeft()
        }
        if (e.key === 'ArrowRight') {
            moveRight()
        }
        if (e.key === 'ArrowDown') {
            moveDown()
        }
        if (e.key === 'ArrowUp') {
            rotate()
        }
    }
    document.body.addEventListener('keydown', keyDownListener)
    return () => {
        document.body.removeEventListener('keydown', keyDownListener)
    }
})

whenIn('playing').on('MOVE_LEFT').moveTo('checkForCollision').updateContext({
    futurePosition: context => [context.position[0] - 1, context.position[1]]
})

whenIn('playing').on('MOVE_RIGHT').moveTo('checkForCollision').updateContext({
    futurePosition: context => [context.position[0] + 1, context.position[1]]
})

whenIn('playing').on('MOVE_DOWN').moveTo('checkForCollision').updateContext({
    futurePosition: context => [context.position[0], context.position[1] + 1]
})