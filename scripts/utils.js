import g from './global';
import { POSITIONS } from './constants';

export const r = (balance = 0.5) => Math.random() < balance;

export const toPos = num => Object.keys(POSITIONS).find(key => POSITIONS[key] === num);

export const isAligned = () => {
  if (g.players.length <= 1) {
    return true;
  }
  for (let i = 1; i < g.players.length; i++) {
    if (g.players[i].position !== g.players[i - 1].position) {
      return false;
    }
  }
  return true;
};

export const log = ({ name, content, type = 'normal' }) => {
  g.log.unshift({
    name,
    content,
    time: new Date().toLocaleTimeString(),
    type,
  });
};
