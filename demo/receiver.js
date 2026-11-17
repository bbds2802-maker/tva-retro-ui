'use strict';

const stations = [
  { frequency: 91.3, code: 'CH 01 / DAWN', name: '晨间中继', level: 68 },
  { frequency: 98.7, code: 'CH 02 / DELTA', name: '德尔塔信标', level: 82 },
  { frequency: 104.5, code: 'CH 03 / OUTER', name: '外环信标', level: 74 },
];
const defaultStation = 1;
const defaultGain = 6;
const minFrequency = 87.5;
const maxFrequency = 108;

const tuning = document.querySelector('#tuning');
const gain = document.querySelector('#gain');
const frequencyDisplay = document.querySelector('#frequency');
const dialReadout = document.querySelector('#dial-readout');
const gainDisplay = document.querySelector('#gain-value');
const stationCode = document.querySelector('#station-code');
const stationName = document.querySelector('#station-name');
const status = document.querySelector('#signal-status');
const strengthDisplay = document.querySelector('#strength-value');
const stationButtons = [...document.querySelectorAll('[data-station]')];
const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
const scanButton = document.querySelector('#scan');
const holdButton = document.querySelector('#hold');
const canvas = document.querySelector('#waveform');
const context = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const tickRing = document.querySelector('.knob-ticks');
const meter = document.querySelector('#meter');
const meterBars = Array.from({length: 12}, () => meter.appendChild(document.createElement('i')));

for (let tick = 0; tick <= 24; tick++) {
  const mark = document.createElement('i');
  mark.style.setProperty('--tick-angle', (-126 + tick * 10.5) + 'deg');
  tickRing.appendChild(mark);
}

let selectedFrequency = stations[defaultStation].frequency;
let gainDb = defaultGain;
let strength = 82;
let scanTimer;
let scanning = false;
let frozen = false;
let phase = 0;
let lastFrame = 0;
let canvasWidth = 0;
let canvasHeight = 0;
let ratio = 1;
let scopeColors;

function nearestStation() {
  return stations.reduce((closest, station) =>
    Math.abs(station.frequency - selectedFrequency) < Math.abs(closest.frequency - selectedFrequency)
      ? station : closest
  );
}

function refreshPanel() {
  const nearest = nearestStation();
  const distance = Math.abs(nearest.frequency - selectedFrequency);
  const matchingPreset = distance < 0.049;
  const locked = distance < 0.35;
  const rawSignal = nearest.level / (1 + distance * distance * 2.1) + (gainDb - defaultGain) * 1.4;
  strength = Math.max(2, Math.min(99, Math.round(rawSignal)));

  const frequencyText = selectedFrequency.toFixed(1);
  tuning.value = frequencyText;
  tuning.setAttribute('aria-valuetext', frequencyText + ' MHz');
  tuning.parentElement.style.setProperty('--angle', (-126 + 252 * (selectedFrequency - minFrequency) / (maxFrequency - minFrequency)) + 'deg');
  frequencyDisplay.value = frequencyText;
  dialReadout.textContent = frequencyText + ' MHz';
  gain.value = gainDb;
  gain.setAttribute('aria-valuetext', gainDb + ' 分贝');
  gain.style.setProperty('--gain-fill', ((gainDb + 12) / 24 * 100) + '%');
  gainDisplay.value = (gainDb > 0 ? '+' : '') + gainDb + ' dB';

  stationCode.textContent = matchingPreset ? nearest.code : 'FM / MANUAL';
  stationName.textContent = locked ? nearest.name : '频段搜索';
  const state = frozen ? 'hold' : scanning ? 'scan' : locked ? 'lock' : 'weak';
  const stateText = {hold:'波形已冻结', scan:'频道扫描中', lock:'信号锁定', weak:'信号较弱'};
  if (status.dataset.state !== state) {
    status.dataset.state = state;
    status.querySelector('span').textContent = stateText[state];
  }

  strengthDisplay.value = strength + '%';
  for (let i = 0; i < meterBars.length; i++) {
    meterBars[i].toggleAttribute('data-lit', i < Math.round(strength * meterBars.length / 100));
  }
  for (let index = 0; index < stationButtons.length; index++) {
    stationButtons[index].setAttribute('aria-pressed', String(matchingPreset && stations[index] === nearest));
  }
  scanButton.setAttribute('aria-pressed', String(scanning));
  holdButton.setAttribute('aria-pressed', String(frozen));
  drawScope();
}

function stopScan() {
  window.clearTimeout(scanTimer);
  scanning = false;
}

function tuneTo(frequency) {
  stopScan();
  frozen = false;
  selectedFrequency = frequency;
  refreshPanel();
}

function advanceScan() {
  const next = (stations.indexOf(nearestStation()) + 1) % stations.length;
  selectedFrequency = stations[next].frequency;
  refreshPanel();
  scanTimer = window.setTimeout(advanceScan, 1750);
}

scanButton.addEventListener('click', () => {
  if (scanning) {
    stopScan();
    refreshPanel();
    return;
  }
  frozen = false;
  scanning = true;
  advanceScan();
});

holdButton.addEventListener('click', () => {
  stopScan();
  frozen = !frozen;
  refreshPanel();
});

for (const button of stationButtons) {
  button.addEventListener('click', () => tuneTo(stations[Number(button.dataset.station)].frequency));
}
tuning.addEventListener('input', () => tuneTo(Number(tuning.value)));
gain.addEventListener('input', () => {
  frozen = false;
  gainDb = Number(gain.value);
  refreshPanel();
});
document.querySelector('#reset').addEventListener('click', () => {
  gainDb = defaultGain;
  tuneTo(stations[defaultStation].frequency);
});

function readScopeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    line: styles.getPropertyValue('--phosphor').trim(),
    grid: styles.getPropertyValue('--grid').trim(),
    lamp: styles.getPropertyValue('--lamp').trim(),
  };
}

for (const button of themeButtons) {
  button.addEventListener('click', () => {
    document.documentElement.dataset.theme = button.dataset.themeChoice;
    for (const option of themeButtons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    scopeColors = readScopeColors();
    drawScope();
  });
}

function fitScope() {
  const size = canvas.getBoundingClientRect();
  canvasWidth = size.width;
  canvasHeight = size.height;
  ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  drawScope();
}

function drawScope() {
  if (!context || !canvasWidth || !canvasHeight || !scopeColors) return;
  const width = canvasWidth;
  const height = canvasHeight;
  const midpoint = height * 0.51;
  const amplitude = Math.max(5, height * 0.31 * (strength / 100));
  const stationOffset = stations.indexOf(nearestStation());
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;
  context.strokeStyle = scopeColors.grid;

  context.beginPath();
  context.globalAlpha = 0.20;
  for (let i = 0; i <= 16; i++) {
    const x = width * i / 16;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let i = 1; i <= 6; i++) {
    const y = height * i / 7;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  context.globalAlpha = 0.42;
  context.setLineDash([3, 4]);
  context.beginPath();
  context.moveTo(0, midpoint);
  context.lineTo(width, midpoint);
  context.stroke();
  context.setLineDash([]);

  context.globalAlpha = 0.43;
  context.strokeStyle = scopeColors.lamp;
  context.beginPath();
  for (let i = 0; i <= 160; i++) {
    const p = i / 160;
    const y = midpoint + height * 0.17 + Math.sin(p * 13 + phase * 0.4) * height * 0.045;
    if (i === 0) context.moveTo(0, y);
    else context.lineTo(p * width, y);
  }
  context.stroke();

  context.globalAlpha = 0.94;
  context.strokeStyle = scopeColors.line;
  context.lineWidth = 1.55;
  context.shadowBlur = 7;
  context.shadowColor = scopeColors.lamp;
  context.beginPath();
  for (let i = 0; i <= 240; i++) {
    const p = i / 240;
    const envelope = 0.24 + 0.76 * Math.exp(-Math.pow((p - 0.53) / 0.26, 2));
    const main = Math.sin(p * (29 + stationOffset * 4) + phase);
    const harmonic = 0.35 * Math.sin(p * 83 - phase * 0.75);
    const noise = Math.sin(p * 380 + phase * 0.55) * 1.7;
    const y = midpoint - (main + harmonic) * amplitude * envelope + noise;
    if (i === 0) context.moveTo(0, y);
    else context.lineTo(p * width, y);
  }
  context.stroke();
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

let animationFrame;

function animate(time) {
  if (!frozen && time - lastFrame >= 33) {
    if (lastFrame) phase += Math.min(65, time - lastFrame) * 0.0018;
    lastFrame = time;
    drawScope();
  }
  animationFrame = requestAnimationFrame(animate);
}

function updateMotion() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  lastFrame = 0;
  if (!reducedMotion.matches) animationFrame = requestAnimationFrame(animate);
  else drawScope();
}

scopeColors = readScopeColors();
if (context) {
  new ResizeObserver(fitScope).observe(canvas);
  fitScope();
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
}
refreshPanel();
