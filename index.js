const HP_THRESHOLD = 40;
const MP_THRESHOLD = 30;
const HP_MAX = 100;
const MP_MAX = 100;
const POSITIONS = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2,
};
const QUICK_SPELL = {
  cost: 10,
  damage: 15,
};
const SLOW_SPELL = {
  cost: 25,
  damage: 40,
};
const MP_POTION_VOL = 10;
const HP_POTION_VOL = 15;
const POTION_LIMIT = 15;

const MAX_TRANSITIONS = 200;
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
const MODEL = {
  [STATES.MP[0]]: [
    {
      action: 'takeMPPotion',
      args: [],
    },
  ],
  [STATES.MP[1]]: [
    {
      action: 'takeMPPotion',
      args: [],
    },
    {
      action: 'spell',
      args: [
        { arg: QUICK_SPELL },
        {
          arg: SLOW_SPELL,
          condition: (states, player) => player.MP > SLOW_SPELL.cost,
        },
      ],
      condition: (states) => states.includes(STATES.ALIGN[0]),
    },
  ],
  [STATES.MP[2]]: [
    {
      action: 'spell',
      args: [
        { arg: QUICK_SPELL },
        { arg: SLOW_SPELL },
      ],
      condition: (states) => states.includes(STATES.ALIGN[0]),
    },
  ],
  [STATES.HP[0]]: [],
  [STATES.HP[1]]: [
    {
      action: 'takeHPPotion',
      args: [],
    },
  ],
  [STATES.HP[2]]: [],
  [STATES.ALIGN[0]]: [
    {
      action: 'move',
      args: [],
    },
  ],
  [STATES.ALIGN[1]]: [
    {
      action: 'move',
      args: [],
    },
  ],
};

const r = (balance = 0.5) => Math.random() < balance;
const toPos = num => Object.keys(POSITIONS).find(key => POSITIONS[key] === num);

function getStates(player) {
  const states = [];
  const { MP, HP } = player;
  // get MP state
  switch (true) {
  case MP > MP_THRESHOLD:
    states.push(STATES.MP[2]);
    break;
  case MP <= MP_THRESHOLD && MP >= QUICK_SPELL.cost:
    states.push(STATES.MP[1]);
    break;
  default:
    states.push(STATES.MP[0]);
  }
  // get HP state
  switch (true) {
  case HP > HP_THRESHOLD:
    states.push(STATES.HP[2]);
    break;
  case HP <= HP_THRESHOLD && HP > 0:
    states.push(STATES.HP[1]);
    break;
  default:
    states.push(STATES.HP[0]);
  }
  // get align state
  if (player1.position === player2.position) {
    states.push(STATES.ALIGN[0]);
  } else {
    states.push(STATES.ALIGN[1]);
  }
  return states;
}

function checkCondition(condition, states, player) {
  if (!condition) {
    return true;
  }
  return condition(states, player);
}

function getActions(player) {
  const states = getStates(player);
  const actions = [];
  states.forEach(state => {
    MODEL[state].forEach(actionObj => {
      const { action, condition } = actionObj;
      if (checkCondition(condition, states, player)) {
        const argArr = actionObj.args
          .filter(argObj => checkCondition(argObj.condition, states, player))
          .map(argObj => argObj.arg);
        actions.push({ action, argArr });
      }
    });
  });
  return actions;
}

class Player {
  constructor(name) {
    this.name = name;
    this.MP = MP_MAX;
    this.HP = HP_MAX;
    this.position = POSITIONS.CENTER;
    this.potionTaken = 0;
  }

  _log(content) {
    g.log.unshift({
      name: `[${this.name}]`,
      content,
      time: new Date().toLocaleTimeString(),
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
    const target = players.find(player => player !== this);
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
    // action pick strategy
    const nextAction = actions.find((action, index) => r((index + 1) / actions.length));
    this[`_${nextAction.action}`](...nextAction.argArr);
    // check action result
    if (players.some(player => player.HP <= 0)) {
      g.end = true;
    }
    g.transitions++;
    return this;
  }
}

const g = {
  log: [],
  end: false,
  transitions: 0,
};
const player1 = new Player('player1');
const player2 = new Player('player2');
const players = [player1, player2];
let current = 1;

const logDom = document.getElementById('log');
const playerTpl = player => `
<div class="player">
  <span class="hp" style="height: ${(100 * Math.max(player.HP, 0) / HP_MAX).toFixed(2)}%">
    ${player.HP}
  </span>
  <span class="divider"></span>
  <span class="mp" style="height: ${(100 * Math.max(player.MP, 0) / MP_MAX).toFixed(2)}%">
    ${player.MP}
  </span>
</div>
`;
const logTpl = log => `
<p>
  <span>${log.name}</span>
  <span>${log.content}</span>
  <span>${log.time}</span>
</p>
`;
function render() {
  document.querySelectorAll('.position-holder').forEach(node => node.innerHTML = '');
  players.forEach(player => {
    const holderDom = document.querySelector(`#${player.name} .position-holder:nth-child(${player.position + 1})`);
    holderDom.innerHTML = playerTpl(player);
  });
  logDom.innerHTML = g.log
    .map(logTpl)
    .join('');
}

const _timer = setInterval(() => {
  if (g.end || g.transitions >= MAX_TRANSITIONS) {
    return clearInterval(_timer);
  }
  if (current === 1) {
    player1.next();
    current = 2;
  } else {
    player2.next();
    current = 1;
  }
  render();
}, 600);
