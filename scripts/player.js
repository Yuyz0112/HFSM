import getActions from './engine/actions';
import { randomStrategy } from './engine/selection-strategy';
import { actionChecker } from './engine/checker';
import g from './global';
import { r, toPos, log } from './utils';
import { MP_MAX, HP_MAX, POSITIONS, POTION_LIMIT, HP_POTION_VOL, MP_POTION_VOL } from './constants';

export default class Player {
  constructor(name) {
    this.name = name;
    this.MP = MP_MAX;
    this.HP = HP_MAX;
    this.position = POSITIONS.CENTER;
    this.potionTaken = 0;
  }

  _log(content) {
    log({
      name: `[${this.name}]`,
      content,
    });
    return this;
  }

  _move() {
    switch (this.position) {
    case POSITIONS.LEFT:
    case POSITIONS.RIGHT:
      this.position = POSITIONS.CENTER;
      break;
    default:
      this.position = r() ? POSITIONS.LEFT : POSITIONS.RIGHT;
      break;
    }
    return this._log(`Move to position ${toPos(this.position)}`);
  }

  _spell(s) {
    this.MP -= s.cost;
    this._log(`Spell cost ${s.cost} MP`);
    const target = g.players.find(player => player !== this);
    target._attacked(s);
    return this;
  }

  _attacked(s) {
    this.HP -= s.damage;
    return this._log(`Been attacked and lost ${s.damage} HP`);
  }

  _checkPotion() {
    if (this.potionTaken >= POTION_LIMIT) {
      this._log('Failed to take HP Potion because reached potion limit');
      return false;
    }
    this.potionTaken++;
    return true;
  }

  _takeHPPotion() {
    if (this._checkPotion()) {
      this.HP += HP_POTION_VOL;
      return this._log(`Take HP potion, recover ${HP_POTION_VOL} HP`);
    }
    return this;
  }

  _takeMPPotion() {
    if (this._checkPotion()) {
      this.MP += MP_POTION_VOL;
      return this._log(`Take MP potion, recover ${MP_POTION_VOL} MP`);
    }
    return this;
  }

  next() {
    // get actions pool
    const actions = getActions(this);
    // apply action pick strategy
    const nextAction = randomStrategy(actions);
    this[`_${nextAction.action}`](...nextAction.args);
    // check action next state
    if (!actionChecker(nextAction, this)) {
      log({
        name: '[Assert.Fail]',
        content: `Action ${nextAction.action} failed.`,
        type: 'error',
      });
    } else {
      log({
        name: '[Assert.Pass]',
        content: `Action ${nextAction.action} passed.`,
        type: 'success',
      });
    }
    return this;
  }
}
