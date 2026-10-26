// Animated AI tutor (a friendly white robot) for the voice and formula pages.
// data-gender = male | female picks the accent colour and a bow tie or a hair bow;
// data-state = idle | listening | thinking | speaking moves the eyes, mouth, arms and lights (all in CSS).
import { h } from './ui.js';

const SVG = `
<svg viewBox="0 0 220 230" class="teacher-svg" role="img">
  <g class="t-waves"><circle cx="110" cy="84" r="62"/><circle cx="110" cy="84" r="62"/><circle cx="110" cy="84" r="62"/></g>
  <g class="t-bubbles"><circle cx="168" cy="40" r="5"/><circle cx="182" cy="25" r="8"/><circle cx="200" cy="8" r="11"/></g>
  <g class="c-bot">
    <g class="c-arm c-arm-l"><rect x="52" y="146" width="22" height="46" rx="11"/></g>
    <g class="c-arm c-arm-r"><rect x="146" y="146" width="22" height="46" rx="11"/></g>
    <rect class="c-shell" x="74" y="134" width="72" height="74" rx="32"/>
    <circle class="c-light" cx="110" cy="174" r="9"/>
    <path class="c-tie c-m" d="M98 136 L110 143 L122 136 L122 150 L110 143 L98 150 Z"/>

    <g class="c-head">
      <path class="c-stalk" d="M110 38 V20"/>
      <circle class="c-tip" cx="110" cy="16" r="7"/>
      <circle class="c-ear" cx="54" cy="84" r="10"/>
      <circle class="c-ear" cx="166" cy="84" r="10"/>
      <rect class="c-shell" x="58" y="38" width="104" height="92" rx="44"/>
      <path class="c-bow c-f" d="M136 42 L150 34 L150 52 Z M136 42 L124 32 L124 52 Z"/>
      <circle class="c-bow c-f" cx="137" cy="42" r="4"/>
      <g class="c-eyes">
        <g class="c-eye"><circle cx="90" cy="80" r="8"/><circle class="c-shine" cx="93" cy="77" r="2.5"/></g>
        <g class="c-eye"><circle cx="130" cy="80" r="8"/><circle class="c-shine" cx="133" cy="77" r="2.5"/></g>
      </g>
      <circle class="c-cheek" cx="76" cy="100" r="8"/>
      <circle class="c-cheek" cx="144" cy="100" r="8"/>
      <path class="c-smile" d="M98 104 Q110 114 122 104"/>
      <ellipse class="c-mouth" cx="110" cy="107" rx="8" ry="6"/>
    </g>
  </g>
</svg>`;

export function teacher(gender = 'female') {
  return h('div.teacher', { 'data-state': 'idle', 'data-gender': gender, 'aria-hidden': 'true', html: SVG });
}
