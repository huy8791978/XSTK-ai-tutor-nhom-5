// Animated teacher for the voice page. data-gender = male | female picks hair, glasses and collar;
// data-state = idle | listening | thinking | speaking moves the arm, face and effects (all in CSS).
import { h } from './ui.js';

const SVG = `
<svg viewBox="0 0 220 230" class="teacher-svg" role="img">
  <g class="t-waves"><circle cx="110" cy="96" r="62"/><circle cx="110" cy="96" r="62"/><circle cx="110" cy="96" r="62"/></g>
  <g class="t-bubbles"><circle cx="160" cy="40" r="6"/><circle cx="174" cy="24" r="9"/><circle cx="194" cy="6" r="12"/></g>

  <!-- long hair behind the head (female) -->
  <path class="t-hair t-f" d="M66 96 C60 46 88 30 110 30 C136 30 162 46 154 100 L160 160 C140 170 80 170 60 160 Z"/>

  <!-- body -->
  <path class="t-jacket" d="M30 230 C34 182 66 160 110 160 C154 160 186 182 190 230 Z"/>
  <path class="t-shirt t-m" d="M94 161 L110 192 L126 161 Z"/>
  <path class="t-tie t-m" d="M106 166 L114 166 L117 192 L110 200 L103 192 Z"/>
  <path class="t-shirt t-f" d="M92 161 C96 182 124 182 128 161 Z"/>
  <rect class="t-skin" x="98" y="128" width="24" height="36" rx="10"/>

  <!-- head -->
  <g class="t-head">
    <ellipse class="t-skin" cx="72" cy="100" rx="7" ry="10"/>
    <ellipse class="t-skin" cx="148" cy="100" rx="7" ry="10"/>
    <ellipse class="t-skin" cx="110" cy="96" rx="38" ry="44"/>
    <path class="t-hair t-m" d="M71 92 C68 52 96 42 114 46 C140 50 152 70 148 94 C142 74 128 64 110 66 C92 66 78 74 71 92 Z"/>
    <path class="t-hair t-f" d="M72 88 C74 58 96 46 112 48 C134 50 148 66 148 90 C136 74 120 66 106 66 C92 68 80 76 72 88 Z"/>
    <circle class="t-earring t-f" cx="72" cy="114" r="3"/><circle class="t-earring t-f" cx="148" cy="114" r="3"/>
    <path class="t-brow t-brow-l" d="M88 84 Q96 79 104 84"/>
    <path class="t-brow t-brow-r" d="M116 84 Q124 79 132 84"/>
    <g class="t-eyes"><circle class="t-eye" cx="96" cy="96" r="4"/><circle class="t-eye" cx="124" cy="96" r="4"/></g>
    <g class="t-glasses t-m"><rect x="84" y="88" width="24" height="17" rx="6"/><rect x="112" y="88" width="24" height="17" rx="6"/><path d="M108 95 L112 95"/></g>
    <path class="t-nose" d="M110 100 Q107 110 112 112"/>
    <path class="t-smile" d="M98 120 Q110 128 122 120"/>
    <ellipse class="t-mouth" cx="110" cy="121" rx="7" ry="4"/>
  </g>

  <!-- arm: rotates about the shoulder (164,206); the hand is a fist with a raised index finger -->
  <g class="t-arm">
    <path class="t-jacket" d="M154 214 L152 150 Q164 142 176 150 L174 214 Z"/>
    <rect class="t-skin" x="157" y="118" width="7" height="22" rx="3.5"/>
    <rect class="t-skin" x="153" y="132" width="24" height="22" rx="10"/>
  </g>
</svg>`;

export function teacher(gender = 'female') {
  return h('div.teacher', { 'data-state': 'idle', 'data-gender': gender, 'aria-hidden': 'true', html: SVG });
}
