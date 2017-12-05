import { exitCondition } from './engine/checker';
import Player from './player';
import g from './global';
import render from './renderer';

const player1 = new Player('player1');
const player2 = new Player('player2');
g.players = [player1, player2];

const _timer = setInterval(() => {
  const currentPlayer = g.players[g.current];
  if (g.current === 0) {
    g.current = 1;
  } else {
    g.current = 0;
  }
  currentPlayer.next();
  render();
  g.transitions++;
  if (exitCondition()) {
    clearInterval(_timer);
  }
}, 600);
