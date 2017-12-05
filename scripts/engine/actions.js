import models from './model';

function checkCondition(condition, combinedStates, player) {
  if (!condition) {
    return true;
  }
  return condition(combinedStates, player);
}

export default function getActions(player) {
  const { mpModel, hpModel, alignModel } = models;
  const mpState = mpModel.getCurrentState(player);
  const hpState = hpModel.getCurrentState(player);
  const alignState = alignModel.getCurrentState(player);
  const combinedStates = [mpState, hpState, alignState];

  const mpTransitions = mpModel.getTransitions(mpState);
  const hpTransitions = hpModel.getTransitions(hpState);
  const alignTransitions = alignModel.getTransitions(alignState);

  return mpTransitions.concat(hpTransitions, alignTransitions).filter(transition =>
    checkCondition(transition.condition, combinedStates, player)
  );
}
