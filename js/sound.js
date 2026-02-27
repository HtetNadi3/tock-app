/* ============================================================
   sound.js — MP3 Audio Engine
   ============================================================ */

const Sound = (() => {
  let audio = null; // Current playing HTML5 Audio object
  let curSound = null;
  let volume = 0.5;

  // Helper to get the correct file path
  const getPath = (name) => `sound-effects/${name}.mp3`;

  function play(type) {
    _stop(); // Stop any existing sound

    audio = new Audio(getPath(type));
    audio.loop = true;
    audio.volume = volume;
    
    audio.play().catch(err => {
      console.error("Playback failed. Check if file exists:", getPath(type), err);
    });

    curSound = type;
  }

  function _stop() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio = null;
    }
  }

  function stop() {
    _stop();
    curSound = null;
  }

  function setVolume(pct) {
    volume = Math.max(0, Math.min(1, pct / 100));
    if (audio) audio.volume = volume;
  }

  function toggle(type) {
    if (curSound === type) {
      stop();
      return false;
    }
    play(type);
    return true;
  }

  function current() { return curSound; }

  // --- Keep your Alarm logic as is ---
  let alarmCtx = null;
  function playAlarm() {
    stopAlarm();
    alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    // ... (Your existing alarm code here) ...
    const seq = [[660,0,.2],[880,.25,.2],[1100,.5,.2],[880,.75,.15],[660,1,.2],[880,1.25,.2],[1100,1.5,.25],[1320,1.8,.3],[880,2.2,.2],[1100,2.45,.2],[880,2.7,.15],[660,2.9,.2],[880,3.15,.2],[1100,3.4,.2],[1320,3.65,.3],[1100,4,.2],[880,4.25,.2],[660,4.5,.3],[880,4.85,.2],[1100,5.1,.25],[1320,5.4,.35],[1100,5.8,.2],[880,6.05,.2],[660,6.3,.4],[880,6.75,.2],[1100,7,.2],[1320,7.25,.2],[1540,7.5,.5],[1320,8.05,.2],[1100,8.3,.2],[880,8.55,.2],[660,8.8,.5]];
    seq.forEach(([fr, st, du]) => {
      const o = alarmCtx.createOscillator(); const g = alarmCtx.createGain();
      o.connect(g); g.connect(alarmCtx.destination);
      o.frequency.value = fr; o.type = 'sine';
      g.gain.setValueAtTime(.3, alarmCtx.currentTime + st);
      g.gain.exponentialRampToValueAtTime(.001, alarmCtx.currentTime + st + du);
      o.start(alarmCtx.currentTime + st); o.stop(alarmCtx.currentTime + st + du + .04);
    });
  }

  function stopAlarm() {
    if (alarmCtx) { alarmCtx.close().catch(()=>{}); alarmCtx = null; }
  }

  return { play, stop, toggle, setVolume, current, playAlarm, stopAlarm };
})();