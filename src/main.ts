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
      gridCell.className = 'grid-cell cellIndex-' + colIndex + '-' + rowIndex;
      gridEl.appendChild(gridCell)
    }
  }
}

function displayPiece(piece: TPiece, position: [number, number]) {
  piece.forEach(block => {
    const x = block[0] + position[0]
    const y = block[1] + position[1]
    const el = document.querySelector('.cellIndex-' + x + '-' + y);
    el?.classList.add('grid-cell-active');
  })
}

function setupGame() {
  const { start, state, send, subscribe } = interpret(tetrisMachine);
  const play = setUpDummyButton('play')
  play.onclick = () => send('PLAY');
  document.body.appendChild(play);
  setupBoard(state.context.gameDims.rows, state.context.gameDims.columns);
  subscribe(newState => displayPiece(newState.context.piece, newState.context.position))
  start();
}

setupGame()