import { MachineConfig, createContext, createEvents, createStates } from "@simple-state-machine/core";
import { TPiece } from "./types";
import { activatePiece, definePieceShapes, erasePiece, rotatePiece } from "./utils";


interface IContext {
    boardState: number[][],
    piece: TPiece,
    gameDims: {
        rows: number,
        columns: number
    },
    position: [number, number]
}

const pieces = definePieceShapes();

const states = createStates('idle', 'playing');

const events = createEvents('ROTATE_PIECE', 'UPDATE_BOARD_STATE', 'MOVE_LEFT', 'MOVE_RIGHT', 'MOVE_DOWN', 'PLAY')

const context: IContext = createContext({
    boardState: [[]],
    piece: pieces['OPiece'],
    position: [4, 0],
    gameDims: {
        rows: 20,
        columns: 10
    }
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

whenIn('playing').after(500).moveTo('playing').fireAndForget(context => erasePiece(context.piece, context.position)).updateContext({
    position: context => [context.position[0], context.position[1] + 1]
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

whenIn('playing').on('MOVE_LEFT').fireAndForget(context => erasePiece(context.piece, context.position)).updateContext({
    position: context => [context.position[0] - 1, context.position[1]]
}).fireAndForget(context => activatePiece(context.piece, context.position))

whenIn('playing').on('MOVE_RIGHT').fireAndForget(context => erasePiece(context.piece, context.position)).updateContext({
    position: context => [context.position[0] + 1, context.position[1]]
}).fireAndForget(context => activatePiece(context.piece, context.position))

whenIn('playing').on('MOVE_DOWN').fireAndForget(context => erasePiece(context.piece, context.position)).updateContext({
    position: context => [context.position[0], context.position[1] + 1]
}).fireAndForget(context => activatePiece(context.piece, context.position))