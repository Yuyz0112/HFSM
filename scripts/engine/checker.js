import g from '../global';
import { MAX_TRANSITIONS } from '../constants';

export function exitCondition() {
  if (g.transitions >= MAX_TRANSITIONS) {
    return true;
  }
  if (g.players.some(player => player.HP <= 0)) {
    return true;
  }
  return false;
}

export function actionChecker(action, player) {
  if (action.ignoreEndState) {
    return true;
  }
  return action.model.getCurrentState(player) === action.endState;
}
