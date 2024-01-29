import { interpret } from '@simple-state-machine/core'
import { tetrisMachine } from './state'
import './style.css'
import { TPiece } from './types';

function setUpDummyButton(text: string) {
  const button = document.createElement('button')
  button.innerText = text;
  return button;
}

function setupBoard(rows: number, columns: number) {
  const gridEl = document.createElement('div');
  gridEl.className = 'grid'
  document.body.appendChild(gridEl);
  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < columns; colIndex++) {
      const gridCell = document.createElement('div')
      gridCell.className = 'grid-cell col-' + colIndex + ' row-' + rowIndex;
      gridEl.appendChild(gridCell)
    }
  }
}

function displayPiece(piece: TPiece, position: [number, number]) {
  piece.forEach(block => {
    const x = block[0] + position[0]
    const y = block[1] + position[1]
    const el = document.querySelector('.col-' + x + '.row-' + y);
    el?.classList.add('grid-cell-active');
  })
}

function runGameLoop(send: (type: 'MOVE_DOWN_FROM_ENGINE') => void) {
  setInterval(() => send('MOVE_DOWN_FROM_ENGINE'), 500)
}

function setupGame() {
  const { start, state, send, subscribe } = interpret(tetrisMachine);
  let prevAccelerate = state.context.shouldAccelerate;
  const play = setUpDummyButton('play');
  play.onclick = () => send('PLAY');
  document.body.appendChild(play);
  const scoreEl = document.getElementById('score')
  setupBoard(state.context.gameDims.rows, state.context.gameDims.columns);
  subscribe(newState => displayPiece(newState.context.piece, newState.context.position))
  subscribe(newState => {
    play.innerText = newState.matchesAny('paused') ? 'Play' : 'Pause';
    play.onclick = () => send(newState.matchesAny('paused') ? 'PLAY' : 'PAUSE')
  })
  subscribe(newState => {
    const { score } = newState.context;
    if (!scoreEl) {
      return;
    }
    scoreEl.innerHTML = 'Score: ' + score
  })

  let timerId: number | undefined;
  subscribe(newState => {
    const { direction, shouldAccelerate } = newState.context;

    if (prevAccelerate !== shouldAccelerate) {
      prevAccelerate = shouldAccelerate;
      if (!shouldAccelerate) {
        clearInterval(timerId);
      }
      if (shouldAccelerate) {
        const actionBasedOnDirection = direction === 'bottom' ? 'MOVE_DOWN' : direction === 'left' ? 'MOVE_LEFT' : direction === 'right' ? 'MOVE_RIGHT' : undefined;
        if (actionBasedOnDirection) {
          timerId = setInterval(() => {
            send(actionBasedOnDirection)
          }, 100);
        }
      }
    }
  })

  start();
  runGameLoop(send);
}

setupGame()