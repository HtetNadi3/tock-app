/* ============================================================
   timer.js — Timer engine (focus / break modes)
   Depends on: store.js, ui.js
   ============================================================ */

const Timer = (() => {
  const CIRC = 276.46; // 2π × 44 (ring radius)

  /* ── state ────────────────────────────────────────────── */
  let mode        = 'focus'; // 'focus' | 'break'
  let focusDur    = 25 * 60;
  let breakDur    = 15 * 60;
  let totalSecs   = focusDur;
  let remainSecs  = focusDur;
  let isRunning   = false;
  let ticker      = null;

  /* ── callbacks (set by app.js) ────────────────────────── */
  let onTick      = null; // (remain, total) => void
  let onEnd       = null; // (mode) => void
  let onStateChange = null; // (isRunning, mode) => void

  /* ── public API ───────────────────────────────────────── */
  function setMode(m) {
    if (isRunning) return;
    mode = m;
    const dur = m === 'focus' ? focusDur : breakDur;
    totalSecs = dur; remainSecs = dur;
    _notify();
  }

  function setFocusDuration(secs) {
    focusDur = secs;
    if (mode === 'focus') { totalSecs = secs; remainSecs = secs; }
    _notify();
  }

  function setBreakDuration(secs) {
    breakDur = secs;
    if (mode === 'break') { totalSecs = secs; remainSecs = secs; }
    _notify();
  }

  function start() {
    if (remainSecs <= 0 || isRunning) return;
    isRunning = true;
    _notify();
    ticker = setInterval(() => {
      remainSecs--;
      if (onTick) onTick(remainSecs, totalSecs);
      _updateRing();
      if (remainSecs <= 0) {
        clearInterval(ticker); ticker = null;
        isRunning = false;
        _notify();
        if (onEnd) onEnd(mode);
      }
    }, 1000);
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(ticker); ticker = null;
    _notify();
  }

  function reset() {
    isRunning = false;
    clearInterval(ticker); ticker = null;
    remainSecs = mode === 'focus' ? focusDur : breakDur;
    totalSecs  = remainSecs;
    _updateRing();
    _notify();
  }

  function toggle() { isRunning ? pause() : start(); }

  /* ── internal ─────────────────────────────────────────── */
  function _notify() {
    _updateRing();
    if (onStateChange) onStateChange({ isRunning, mode, remainSecs, totalSecs });
  }

  function _updateRing() {
    const el = document.getElementById('ring-fill');
    const timeEl = document.getElementById('ring-time');
    const modeEl = document.getElementById('ring-mode');
    if (!el) return;

    const prog   = 1 - (remainSecs / totalSecs);
    const offset = CIRC * (1 - prog);
    const danger = remainSecs <= 60 && isRunning && mode === 'focus';

    el.style.strokeDashoffset = offset;
    el.classList.toggle('mode-break', mode === 'break' && !danger);
    el.classList.toggle('danger', danger);

    const timeString = _fmt(remainSecs);

    timeEl.textContent = _fmt(remainSecs);
    timeEl.classList.toggle('danger', danger);
    modeEl.textContent = mode === 'focus' ? 'Focus' : 'Break';
    document.title = isRunning ? `${timeString} | TOCK` : "TOCK — Elite Focus";
  }

  function _fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return h > 0
      ? `${h}:${_p(m)}:${_p(sc)}`
      : `${_p(m)}:${_p(sc)}`;
  }
  function _p(n) { return String(n).padStart(2, '0'); }

  /* ── getters ──────────────────────────────────────────── */
  function getState() { return { isRunning, mode, remainSecs, totalSecs, focusDur, breakDur }; }
  function getMode()  { return mode; }
  function running()  { return isRunning; }
  function getFocusDur() { return focusDur; }

  return {
    setMode, setFocusDuration, setBreakDuration,
    start, pause, reset, toggle,
    getState, getMode, running, getFocusDur,
    set onTick(fn)        { onTick = fn; },
    set onEnd(fn)         { onEnd = fn; },
    set onStateChange(fn) { onStateChange = fn; },
  };
})();


