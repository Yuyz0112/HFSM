import g from './global';
import { HP_MAX, MP_MAX } from './constants';

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
<p class="${log.type}">
  <span>${log.name}</span>
  <span>${log.content}</span>
  <span>${log.time}</span>
</p>
`;
export default function render() {
  document.querySelectorAll('.position-holder').forEach(node => node.innerHTML = '');
  g.players.forEach(player => {
    const holderDom = document.querySelector(`#${player.name} .position-holder:nth-child(${player.position + 1})`);
    holderDom.innerHTML = playerTpl(player);
  });
  logDom.innerHTML = g.log
    .map(logTpl)
    .join('');
}
