import { isAligned } from '../utils';
import { QUICK_SPELL, SLOW_SPELL, MP_THRESHOLD, HP_THRESHOLD } from '../constants';

class Model {
  constructor({ states }) {
    this.states = {};
    for (const state of states) {
      this.states[state] = {
        transitions: [],
      };
    }
  }

  addTransitions(state, transitions) {
    for (const transition of transitions) {
      this.states[state].transitions.push(Object.assign(transition, {
        model: this,
      }));
    }
    return this;
  }

  getTransitions(state) {
    return this.states[state].transitions;
  }

  setStateCondition(state, condition) {
    this.states[state].condition = condition;
    return this;
  }

  getCurrentState(player) {
    for (let stateKey in this.states) {
      const state = this.states[stateKey];
      if (!state.condition) {
        return stateKey;
      }
      if (state.condition(player)) {
        return stateKey;
      }
    }
  }
}

const STATES = {
  MP: [
    `MP<${QUICK_SPELL.cost}`,
    `${QUICK_SPELL.cost}<=MP<=${MP_THRESHOLD}`,
    `MP>${MP_THRESHOLD}`,
  ],
  HP: [
    'HP<0',
    `${QUICK_SPELL.cost}<=HP<=${HP_THRESHOLD}`,
    `HP>${HP_THRESHOLD}`,
  ],
  ALIGN: [
    'aligned',
    'not aligned',
  ],
};

const mpModel = new Model({
  states: STATES.MP,
});

mpModel.setStateCondition(STATES.MP[0], (player) => {
  return player.MP < QUICK_SPELL.cost;
}).setStateCondition(STATES.MP[1], (player) => {
  const { MP } = player;
  return MP < MP_THRESHOLD && MP >= QUICK_SPELL.cost;
}).setStateCondition(STATES.MP[2], (player) => {
  return player.MP >= MP_THRESHOLD;
}).addTransitions(STATES.MP[0], [
  {
    action: 'takeMPPotion',
    args: [],
    endState: STATES.MP[1],
  },
]).addTransitions(STATES.MP[1], [
  {
    action: 'takeMPPotion',
    args: [],
    endState: STATES.MP[2],
  },
  {
    action: 'spell',
    args: [QUICK_SPELL],
    condition: (combinedStates) => combinedStates.includes(STATES.ALIGN[0]),
    // ignore end state means no need to check the end state of this transition
    ignoreEndState: true,
  },
  {
    action: 'spell',
    args: [SLOW_SPELL],
    condition: (combinedStates, player) => combinedStates.includes(STATES.ALIGN[0]) && player.MP > SLOW_SPELL.cost,
    endState: STATES.MP[0],
  },
]).addTransitions(STATES.MP[2], [
  {
    action: 'spell',
    args: [QUICK_SPELL],
    condition: (combinedStates) => combinedStates.includes(STATES.ALIGN[0]),
    ignoreEndState: true,
  },
  {
    action: 'spell',
    args: [SLOW_SPELL],
    condition: (combinedStates) => combinedStates.includes(STATES.ALIGN[0]),
    ignoreEndState: true,
  },
]);

const hpModel = new Model({
  states: STATES.HP,
});
hpModel.setStateCondition(STATES.HP[0], (player) => {
  return player.HP <= 0;
}).setStateCondition(STATES.HP[1], (player) => {
  const { HP } = player;
  return HP <= HP_THRESHOLD && HP > 0;
}).setStateCondition(STATES.HP[2], (player) => {
  return player.HP > HP_THRESHOLD;
}).addTransitions(STATES.HP[1], [
  {
    action: 'takeHPPotion',
    args: [],
    endState: STATES.HP[2],
  },
]);

const alignModel = new Model({
  states: STATES.ALIGN,
});
alignModel.setStateCondition(STATES.ALIGN[0], () => {
  return isAligned();
}).setStateCondition(STATES.ALIGN[1], () => {
  return !isAligned();
}).addTransitions(STATES.ALIGN[0], [
  {
    action: 'move',
    args: [],
    endState: STATES.ALIGN[1],
  },
]).addTransitions(STATES.ALIGN[1], [
  {
    action: 'move',
    args: [],
    ignoreEndState: true,
  },
]);

export default {
  mpModel,
  hpModel,
  alignModel,
};
