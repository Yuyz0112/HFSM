'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var g = {
    log: [],
    transitions: 0,
    current: 1,
    players: []
  };

  // game constants
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
  var MP_POTION_VOL = 20;
  var HP_POTION_VOL = 40;
  var POTION_LIMIT = 10;

  // state machine constants
  var MAX_TRANSITIONS = 200;

  function exitCondition() {
    if (g.transitions >= MAX_TRANSITIONS) {
      return true;
    }
    if (g.players.some(function (player) {
      return player.HP <= 0;
    })) {
      return true;
    }
    return false;
  }

  function actionChecker(action, player) {
    if (action.ignoreEndState) {
      return true;
    }
    return action.model.getCurrentState(player) === action.endState;
  }

  var r = function r() {
    var balance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0.5;
    return Math.random() < balance;
  };

  var toPos = function toPos(num) {
    return Object.keys(POSITIONS).find(function (key) {
      return POSITIONS[key] === num;
    });
  };

  var isAligned = function isAligned() {
    if (g.players.length <= 1) {
      return true;
    }
    for (var i = 1; i < g.players.length; i++) {
      if (g.players[i].position !== g.players[i - 1].position) {
        return false;
      }
    }
    return true;
  };

  var log = function log(_ref) {
    var name = _ref.name,
        content = _ref.content,
        _ref$type = _ref.type,
        type = _ref$type === undefined ? 'normal' : _ref$type;

    g.log.unshift({
      name: name,
      content: content,
      time: new Date().toLocaleTimeString(),
      type: type
    });
  };

  var Model = function () {
    function Model(_ref2) {
      var states = _ref2.states;

      _classCallCheck(this, Model);

      this.states = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = states[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var state = _step.value;

          this.states[state] = {
            transitions: []
          };
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    _createClass(Model, [{
      key: 'addTransitions',
      value: function addTransitions(state, transitions) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = transitions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var transition = _step2.value;

            this.states[state].transitions.push(Object.assign(transition, {
              model: this
            }));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return this;
      }
    }, {
      key: 'getTransitions',
      value: function getTransitions(state) {
        return this.states[state].transitions;
      }
    }, {
      key: 'setStateCondition',
      value: function setStateCondition(state, condition) {
        this.states[state].condition = condition;
        return this;
      }
    }, {
      key: 'getCurrentState',
      value: function getCurrentState(player) {
        for (var stateKey in this.states) {
          var state = this.states[stateKey];
          if (!state.condition) {
            return stateKey;
          }
          if (state.condition(player)) {
            return stateKey;
          }
        }
      }
    }]);

    return Model;
  }();

  var STATES = {
    MP: ['MP<' + QUICK_SPELL.cost, QUICK_SPELL.cost + '<=MP<=' + MP_THRESHOLD, 'MP>' + MP_THRESHOLD],
    HP: ['HP<0', QUICK_SPELL.cost + '<=HP<=' + HP_THRESHOLD, 'HP>' + HP_THRESHOLD],
    ALIGN: ['aligned', 'not aligned']
  };

  var mpModel = new Model({
    states: STATES.MP
  });

  mpModel.setStateCondition(STATES.MP[0], function (player) {
    return player.MP < QUICK_SPELL.cost;
  }).setStateCondition(STATES.MP[1], function (player) {
    var MP = player.MP;

    return MP < MP_THRESHOLD && MP >= QUICK_SPELL.cost;
  }).setStateCondition(STATES.MP[2], function (player) {
    return player.MP >= MP_THRESHOLD;
  }).addTransitions(STATES.MP[0], [{
    action: 'takeMPPotion',
    args: [],
    endState: STATES.MP[1]
  }]).addTransitions(STATES.MP[1], [{
    action: 'takeMPPotion',
    args: [],
    endState: STATES.MP[2]
  }, {
    action: 'spell',
    args: [QUICK_SPELL],
    condition: function condition(combinedStates) {
      return combinedStates.includes(STATES.ALIGN[0]);
    },
    // ignore end state means no need to check the end state of this transition
    ignoreEndState: true
  }, {
    action: 'spell',
    args: [SLOW_SPELL],
    condition: function condition(combinedStates, player) {
      return combinedStates.includes(STATES.ALIGN[0]) && player.MP > SLOW_SPELL.cost;
    },
    endState: STATES.MP[0]
  }]).addTransitions(STATES.MP[2], [{
    action: 'spell',
    args: [QUICK_SPELL],
    condition: function condition(combinedStates) {
      return combinedStates.includes(STATES.ALIGN[0]);
    },
    ignoreEndState: true
  }, {
    action: 'spell',
    args: [SLOW_SPELL],
    condition: function condition(combinedStates) {
      return combinedStates.includes(STATES.ALIGN[0]);
    },
    ignoreEndState: true
  }]);

  var hpModel = new Model({
    states: STATES.HP
  });
  hpModel.setStateCondition(STATES.HP[0], function (player) {
    return player.HP <= 0;
  }).setStateCondition(STATES.HP[1], function (player) {
    var HP = player.HP;

    return HP <= HP_THRESHOLD && HP > 0;
  }).setStateCondition(STATES.HP[2], function (player) {
    return player.HP > HP_THRESHOLD;
  }).addTransitions(STATES.HP[1], [{
    action: 'takeHPPotion',
    args: [],
    endState: STATES.HP[2]
  }]);

  var alignModel = new Model({
    states: STATES.ALIGN
  });
  alignModel.setStateCondition(STATES.ALIGN[0], function () {
    return isAligned();
  }).setStateCondition(STATES.ALIGN[1], function () {
    return !isAligned();
  }).addTransitions(STATES.ALIGN[0], [{
    action: 'move',
    args: [],
    endState: STATES.ALIGN[1]
  }]).addTransitions(STATES.ALIGN[1], [{
    action: 'move',
    args: [],
    ignoreEndState: true
  }]);

  var models = {
    mpModel: mpModel,
    hpModel: hpModel,
    alignModel: alignModel
  };

  function checkCondition(condition, combinedStates, player) {
    if (!condition) {
      return true;
    }
    return condition(combinedStates, player);
  }

  function getActions(player) {
    var mpModel = models.mpModel,
        hpModel = models.hpModel,
        alignModel = models.alignModel;

    var mpState = mpModel.getCurrentState(player);
    var hpState = hpModel.getCurrentState(player);
    var alignState = alignModel.getCurrentState(player);
    var combinedStates = [mpState, hpState, alignState];

    var mpTransitions = mpModel.getTransitions(mpState);
    var hpTransitions = hpModel.getTransitions(hpState);
    var alignTransitions = alignModel.getTransitions(alignState);

    return mpTransitions.concat(hpTransitions, alignTransitions).filter(function (transition) {
      return checkCondition(transition.condition, combinedStates, player);
    });
  }

  var randomStrategy = function randomStrategy(actions) {
    return actions.find(function (action, index) {
      return r((index + 1) / actions.length);
    });
  };

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
        log({
          name: '[' + this.name + ']',
          content: content
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
        var target = g.players.find(function (player) {
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
        // apply action pick strategy
        var nextAction = randomStrategy(actions);
        this['_' + nextAction.action].apply(this, _toConsumableArray(nextAction.args));
        // check action next state
        if (!actionChecker(nextAction, this)) {
          log({
            name: '[Assert.Fail]',
            content: 'Action ' + nextAction.action + ' assertion failed.',
            type: 'error'
          });
        } else {
          log({
            name: '[Assert.Pass]',
            content: 'Action ' + nextAction.action + ' assertion passed.',
            type: 'success'
          });
        }
        return this;
      }
    }]);

    return Player;
  }();

  var logDom = document.getElementById('log');
  var playerTpl = function playerTpl(player) {
    return '\n<div class="player">\n  <span class="hp" style="height: ' + (100 * Math.max(player.HP, 0) / HP_MAX).toFixed(2) + '%">\n    ' + player.HP + '\n  </span>\n  <span class="divider"></span>\n  <span class="mp" style="height: ' + (100 * Math.max(player.MP, 0) / MP_MAX).toFixed(2) + '%">\n    ' + player.MP + '\n  </span>\n</div>\n';
  };
  var logTpl = function logTpl(log) {
    return '\n<p class="' + log.type + '">\n  <span>' + log.name + '</span>\n  <span>' + log.content + '</span>\n  <span>' + log.time + '</span>\n</p>\n';
  };
  function render() {
    document.querySelectorAll('.position-holder').forEach(function (node) {
      return node.innerHTML = '';
    });
    g.players.forEach(function (player) {
      var holderDom = document.querySelector('#' + player.name + ' .position-holder:nth-child(' + (player.position + 1) + ')');
      holderDom.innerHTML = playerTpl(player);
    });
    logDom.innerHTML = g.log.map(logTpl).join('');
  }

  var player1 = new Player('player1');
  var player2 = new Player('player2');
  g.players = [player1, player2];

  var _timer = setInterval(function () {
    var currentPlayer = g.players[g.current];
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
})();
