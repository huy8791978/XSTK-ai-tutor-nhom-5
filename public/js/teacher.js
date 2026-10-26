// Animated AI tutor (robot with a screen for a face) for the voice and formula pages.
// data-gender = male | female picks the eye shape and the accent light; data-state = idle | listening | thinking |
// speaking drives the LED eyes, the sound-wave mouth, the antenna and the chest light (all in CSS).
import { h } from './ui.js';

const SVG = `
<svg viewBox="0 0 220 230" class="teacher-svg" role="img">
  <g class="t-waves"><circle cx="110" cy="82" r="66"/><circle cx="110" cy="82" r="66"/><circle cx="110" cy="82" r="66"/></g>
  <g class="r-bot">
    <path class="r-stalk" d="M110 30 V16"/>
    <circle class="r-tip" cx="110" cy="12" r="6"/>
    <rect class="r-ear" x="38" y="66" width="16" height="36" rx="6"/>
    <rect class="r-ear" x="166" y="66" width="16" height="36" rx="6"/>
    <rect class="r-frame" x="50" y="30" width="120" height="104" rx="24"/>
    <rect class="r-screen" x="62" y="42" width="96" height="80" rx="16"/>
    <rect class="r-glare" x="72" y="49" width="28" height="5" rx="2.5"/>

    <g class="r-eyes">
      <rect class="r-eye r-m" x="80" y="62" width="16" height="18" rx="4"/>
      <rect class="r-eye r-m" x="124" y="62" width="16" height="18" rx="4"/>
      <ellipse class="r-eye r-f" cx="88" cy="71" rx="8.5" ry="10"/>
      <ellipse class="r-eye r-f" cx="132" cy="71" rx="8.5" ry="10"/>
      <path class="r-lash r-f" d="M79 61 l-4 -4 M84 59 l-2 -5 M141 61 l4 -4 M136 59 l2 -5"/>
    </g>
    <g class="r-dots"><circle cx="96" cy="71" r="4.5"/><circle cx="110" cy="71" r="4.5"/><circle cx="124" cy="71" r="4.5"/></g>

    <!-- mouth: a sound wave that moves with the voice -->
    <g class="r-wave">
      <rect x="84" y="96" width="4" height="16" rx="2"/><rect x="92" y="96" width="4" height="16" rx="2"/>
      <rect x="100" y="96" width="4" height="16" rx="2"/><rect x="108" y="96" width="4" height="16" rx="2"/>
      <rect x="116" y="96" width="4" height="16" rx="2"/><rect x="124" y="96" width="4" height="16" rx="2"/>
      <rect x="132" y="96" width="4" height="16" rx="2"/>
    </g>

    <rect class="r-neck" x="98" y="134" width="24" height="16" rx="4"/>
    <path class="r-body" d="M44 230 C46 178 70 150 110 150 C150 150 174 178 176 230 Z"/>
    <path class="r-seam" d="M74 200 H146"/>
    <circle class="r-ring" cx="110" cy="184" r="17"/>
    <circle class="r-core" cx="110" cy="184" r="10"/>
  </g>
</svg>`;

export function teacher(gender = 'female') {
  return h('div.teacher', { 'data-state': 'idle', 'data-gender': gender, 'aria-hidden': 'true', html: SVG });
}
