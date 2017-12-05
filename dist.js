'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _MODEL;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var HP_THRESHOLD = 40;
var MP_THRESHOLD = 30;
var HP_MAX = 100;
var MP_MAX = 100;
var POSITIONS = {
  LEFT: 0,
  CENTER: 1,
  RIGHT: 2
};
var QUICK_SPELL = {
  cost: 10,
  damage: 15
};
var SLOW_SPELL = {
  cost: 25,
  damage: 40
};
var MP_POTION_VOL = 10;
var HP_POTION_VOL = 15;
var POTION_LIMIT = 15;

var MAX_TRANSITIONS = 200;
var STATES = {
  MP: ['MP<' + QUICK_SPELL.cost, QUICK_SPELL.cost + '<=MP<=' + MP_THRESHOLD, 'MP>' + MP_THRESHOLD],
  HP: ['HP<0', QUICK_SPELL.cost + '<=HP<=' + HP_THRESHOLD, 'HP>' + HP_THRESHOLD],
  ALIGN: ['aligned', 'not aligned']
};
var MODEL = (_MODEL = {}, _defineProperty(_MODEL, STATES.MP[0], [{
  action: 'takeMPPotion',
  args: []
}]), _defineProperty(_MODEL, STATES.MP[1], [{
  action: 'takeMPPotion',
  args: []
}, {
  action: 'spell',
  args: [{ arg: QUICK_SPELL }, {
    arg: SLOW_SPELL,
    condition: function condition(states, player) {
      return player.MP > SLOW_SPELL.cost;
    }
  }],
  condition: function condition(states) {
    return states.includes(STATES.ALIGN[0]);
  }
}]), _defineProperty(_MODEL, STATES.MP[2], [{
  action: 'spell',
  args: [{ arg: QUICK_SPELL }, { arg: SLOW_SPELL }],
  condition: function condition(states) {
    return states.includes(STATES.ALIGN[0]);
  }
}]), _defineProperty(_MODEL, STATES.HP[0], []), _defineProperty(_MODEL, STATES.HP[1], [{
  action: 'takeHPPotion',
  args: []
}]), _defineProperty(_MODEL, STATES.HP[2], []), _defineProperty(_MODEL, STATES.ALIGN[0], [{
  action: 'move',
  args: []
}]), _defineProperty(_MODEL, STATES.ALIGN[1], [{
  action: 'move',
  args: []
}]), _MODEL);

var r = function r() {
  var balance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
  return Math.random() < balance;
};
var toPos = function toPos(num) {
  return Object.keys(POSITIONS).find(function (key) {
    return POSITIONS[key] === num;
  });
};

function getStates(player) {
  var states = [];
  var MP = player.MP,
      HP = player.HP;
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
  var states = getStates(player);
  var actions = [];
  states.forEach(function (state) {
    MODEL[state].forEach(function (actionObj) {
      var action = actionObj.action,
          condition = actionObj.condition;

      if (checkCondition(condition, states, player)) {
        var argArr = actionObj.args.filter(function (argObj) {
          return checkCondition(argObj.condition, states, player);
        }).map(function (argObj) {
          return argObj.arg;
        });
        actions.push({ action: action, argArr: argArr });
      }
    });
  });
  return actions;
}

var Player = function () {
  function Player(name) {
    _classCallCheck(this, Player);

    this.name = name;
    this.MP = MP_MAX;
    this.HP = HP_MAX;
    this.position = POSITIONS.CENTER;
    this.potionTaken = 0;
  }

  _createClass(Player, [{
    key: '_log',
    value: function _log(content) {
      g.log.unshift({
        name: '[' + this.name + ']',
        content: content,
        time: new Date().toLocaleTimeString()
      });
      return this;
    }
  }, {
    key: '_move',
    value: function _move() {
      switch (this.position) {
        case POSITIONS.LEFT:
        case POSITIONS.RIGHT:
          this.position = POSITIONS.CENTER;
          break;
        default:
          this.position = r() ? POSITIONS.LEFT : POSITIONS.RIGHT;
          break;
      }
      return this._log('Move to position ' + toPos(this.position));
    }
  }, {
    key: '_spell',
    value: function _spell(s) {
      var _this = this;

      this.MP -= s.cost;
      this._log('Spell cost ' + s.cost + ' MP');
      var target = players.find(function (player) {
        return player !== _this;
      });
      target._attacked(s);
      return this;
    }
  }, {
    key: '_attacked',
    value: function _attacked(s) {
      this.HP -= s.damage;
      return this._log('Been attacked and lost ' + s.damage + ' HP');
    }
  }, {
    key: '_checkPotion',
    value: function _checkPotion() {
      if (this.potionTaken >= POTION_LIMIT) {
        this._log('Failed to take HP Potion because reached potion limit');
        return false;
      }
      this.potionTaken++;
      return true;
    }
  }, {
    key: '_takeHPPotion',
    value: function _takeHPPotion() {
      if (this._checkPotion()) {
        this.HP += HP_POTION_VOL;
        return this._log('Take HP potion, recover ' + HP_POTION_VOL + ' HP');
      }
      return this;
    }
  }, {
    key: '_takeMPPotion',
    value: function _takeMPPotion() {
      if (this._checkPotion()) {
        this.MP += MP_POTION_VOL;
        return this._log('Take MP potion, recover ' + MP_POTION_VOL + ' MP');
      }
      return this;
    }
  }, {
    key: 'next',
    value: function next() {
      // get actions pool
      var actions = getActions(this);
      // action pick strategy
      var nextAction = actions.find(function (action, index) {
        return r((index + 1) / actions.length);
      });
      this['_' + nextAction.action].apply(this, _toConsumableArray(nextAction.argArr));
      // check action result
      if (players.some(function (player) {
        return player.HP <= 0;
      })) {
        g.end = true;
      }
      g.transitions++;
      return this;
    }
  }]);

  return Player;
}();

var g = {
  log: [],
  end: false,
  transitions: 0
};
var player1 = new Player('player1');
var player2 = new Player('player2');
var players = [player1, player2];
var current = 1;

var logDom = document.getElementById('log');
var playerTpl = function playerTpl(player) {
  return '\n<div class="player">\n  <span class="hp" style="height: ' + (100 * Math.max(player.HP, 0) / HP_MAX).toFixed(2) + '%">\n    ' + player.HP + '\n  </span>\n  <span class="divider"></span>\n  <span class="mp" style="height: ' + (100 * Math.max(player.MP, 0) / MP_MAX).toFixed(2) + '%">\n    ' + player.MP + '\n  </span>\n</div>\n';
};
var logTpl = function logTpl(log) {
  return '\n<p>\n  <span>' + log.name + '</span>\n  <span>' + log.content + '</span>\n  <span>' + log.time + '</span>\n</p>\n';
};
function render() {
  document.querySelectorAll('.position-holder').forEach(function (node) {
    return node.innerHTML = '';
  });
  players.forEach(function (player) {
    var holderDom = document.querySelector('#' + player.name + ' .position-holder:nth-child(' + (player.position + 1) + ')');
    holderDom.innerHTML = playerTpl(player);
  });
  logDom.innerHTML = g.log.map(logTpl).join('');
}

var _timer = setInterval(function () {
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
