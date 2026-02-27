/* ============================================================
   app.js — Wires Store + Timer + Sound + UI together
   All event listeners live here. No direct DOM manipulation.
   ============================================================ */

(function init() {

  /* ── boot ─────────────────────────────────────────────── */
  Store.load();
  UI.renderStats();
  UI.renderTasks('all', taskCallbacks());
  UI.syncModeTabs('focus');

  /* ── timer callbacks ──────────────────────────────────── */
  Timer.onStateChange = (state) => {
    UI.syncTimer(state);
    UI.syncModeTabs(state.mode);
    UI.renderTasks(curFilter(), taskCallbacks());
  };

  Timer.onEnd = (mode) => {
    if (mode === 'focus') {
      const mins = Timer.getFocusDur() / 60;
      Store.recordSession(mins);
      Store.completeActive();
      UI.renderStats();
      UI.renderTasks(curFilter(), taskCallbacks());
      const next = Store.getActiveTask();
      Sound.playAlarm();
      UI.showAlarm({
        heading: "TIME'S UP",
        headingClass: 'focus',
        sub: next ? `Next: "${next.name}"` : 'All tasks done — great work! 🎉',
        onClose: () => Sound.stopAlarm(),
      });
    } else {
      Sound.playAlarm();
      UI.showAlarm({
        heading: 'BREAK OVER',
        headingClass: 'brk',
        sub: "Back to it — you've got this 💪",
        onClose: () => Sound.stopAlarm(),
      });
    }
    UI.syncPill();
  };

  /* ── mode tabs ────────────────────────────────────────── */
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (Timer.running()) return;
      Timer.setMode(tab.dataset.mode);
      UI.syncModeTabs(tab.dataset.mode);
    });
  });

  /* ── timer controls ───────────────────────────────────── */
  document.getElementById('btn-main').addEventListener('click', () => Timer.toggle());
  document.getElementById('btn-reset').addEventListener('click', () => Timer.reset());

  /* ── custom duration ──────────────────────────────────── */
  document.getElementById('btn-set-dur').addEventListener('click', () => {
    const h = parseInt(document.getElementById('dur-h').value) || 0;
    const m = parseInt(document.getElementById('dur-m').value) || 0;
    const secs = h * 3600 + m * 60;
    if (secs <= 0) return;
    if (Timer.getMode() === 'focus') Timer.setFocusDuration(secs);
    else                             Timer.setBreakDuration(secs);
    Timer.reset();
  });

  // clamp inputs
  document.getElementById('dur-h').addEventListener('change', e => {
    e.target.value = Math.min(23, Math.max(0, parseInt(e.target.value)||0));
  });
  document.getElementById('dur-m').addEventListener('change', e => {
    e.target.value = Math.min(59, Math.max(0, parseInt(e.target.value)||0));
  });

  /* ── add task form ────────────────────────────────────── */
  let selectedDur = 25;

  document.querySelectorAll('.dur-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedDur = parseInt(btn.dataset.mins);
      document.getElementById('dur-custom').value = '';
      UI.syncDurPreset(selectedDur);
    });
  });

  document.getElementById('dur-custom').addEventListener('input', e => {
    const v = parseInt(e.target.value);
    if (v > 0) {
      selectedDur = v;
      UI.syncDurPreset(-1); // deselect all presets
    }
  });

  function submitTask() {
    const inp  = document.getElementById('task-inp');
    const name = inp.value.trim();
    if (!name) return;
    const cust = parseInt(document.getElementById('dur-custom').value);
    const mins = cust > 0 ? cust : selectedDur;
    const task = Store.addTask(name, mins);
    // apply task duration to timer
    Timer.setFocusDuration(task.durMins * 60);
    document.getElementById('dur-h').value = 0;
    document.getElementById('dur-m').value = task.durMins;
    inp.value = '';
    document.getElementById('dur-custom').value = '';
    UI.syncDurPreset(selectedDur);
    UI.renderTasks(curFilter(), taskCallbacks());
    UI.renderStats();
    UI.syncPill();
  }

  document.getElementById('btn-add-task').addEventListener('click', submitTask);
  document.getElementById('task-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitTask();
  });

  /* ── filter tabs ──────────────────────────────────────── */
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t === tab));
      UI.renderTasks(tab.dataset.f, taskCallbacks());
    });
  });

  function curFilter() {
    return document.querySelector('.filter-tab.active')?.dataset.f || 'all';
  }

  /* ── task callbacks ───────────────────────────────────── */
  function taskCallbacks() {
    return {
      onSelect(id) {
        const t = Store.setActive(id);
        if (!t) return;
        Timer.setFocusDuration(t.durMins * 60);
        document.getElementById('dur-h').value = 0;
        document.getElementById('dur-m').value = t.durMins;
        UI.syncDurPreset(t.durMins);
        UI.renderTasks(curFilter(), taskCallbacks());
        UI.syncPill();
      },
      onDelete(id) {
        Store.deleteTask(id);
        UI.renderTasks(curFilter(), taskCallbacks());
        UI.renderStats();
        UI.syncPill();
      },
      onRepeat(id) {
        const t = Store.repeatTask(id);
        if (!t) return;
        Timer.setFocusDuration(t.durMins * 60);
        document.getElementById('dur-h').value = 0;
        document.getElementById('dur-m').value = t.durMins;
        UI.syncDurPreset(t.durMins);
        UI.renderTasks(curFilter(), taskCallbacks());
        UI.renderStats();
        UI.syncPill();
      },
    };
  }

  /* ── clear done ───────────────────────────────────────── */
  document.getElementById('btn-clear-done').addEventListener('click', () => {
    Store.clearDone();
    UI.renderTasks(curFilter(), taskCallbacks());
    UI.renderStats();
    UI.syncPill();
  });

  /* ── sound toggle ─────────────────────────────────────── */
  document.getElementById('sound-toggle').addEventListener('change', e => {
    const body = document.getElementById('sound-body');
    body.style.display = e.target.checked ? 'flex' : 'none';
    if (!e.target.checked) { Sound.stop(); UI.syncSoundBtn(null, false); }
  });

  document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!document.getElementById('sound-toggle').checked) return;
      const active = Sound.toggle(btn.dataset.sound);
      UI.syncSoundBtn(btn.dataset.sound, active);
      // if toggled off (active=false), clear all highlights
      if (!active) UI.syncSoundBtn(null, false);
    });
  });

  /* ── volume slider ────────────────────────────────────── */
  function applyVolume(pct) {
    Sound.setVolume(pct);
    UI.syncVolume(pct);
  }

  const volTrack = document.getElementById('vol-track');
  document.getElementById('vol-range').addEventListener('input', e => applyVolume(parseInt(e.target.value)));

  volTrack.addEventListener('mousedown', startVolDrag);
  volTrack.addEventListener('touchstart', startVolDrag, { passive: true });

  function startVolDrag(e) {
    function getPercent(ev) {
      const rect = volTrack.getBoundingClientRect();
      const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;
      return Math.round(Math.max(0, Math.min(1, x / rect.width)) * 100);
    }
    applyVolume(getPercent(e));
    const onMove = ev => applyVolume(getPercent(ev));
    const onUp   = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
  }

  // init volume at 50%
  applyVolume(50);

})();
