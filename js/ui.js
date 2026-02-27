/* ============================================================
   ui.js — DOM rendering & view helpers (no business logic)
   Depends on: store.js, timer.js
   ============================================================ */

const UI = (() => {

  /* ── element cache ────────────────────────────────────── */
  const $ = id => document.getElementById(id);

  const els = {
    logoDot:      () => $('logo-dot'),
    timerCard:    () => $('timer-card'),
    activePill:   () => $('active-pill'),
    pillText:     () => $('pill-text'),
    ringFill:     () => $('ring-fill'),
    ringTime:     () => $('ring-time'),
    ringMode:     () => $('ring-mode'),
    btnMain:      () => $('btn-main'),
    btnReset:     () => $('btn-reset'),
    taskList:     () => $('task-list'),
    colMeta:      () => $('col-meta'),
    alarmOverlay: () => $('alarm-overlay'),
    alarmHeading: () => $('alarm-heading'),
    alarmSub:     () => $('alarm-sub'),
    alarmCd:      () => $('alarm-cd'),
    hs1:          () => $('hs-sessions'),
    hs2:          () => $('hs-focus'),
    hs3:          () => $('hs-done'),
  };

  /* ── timer state → UI ─────────────────────────────────── */
  function syncTimer({ isRunning, mode, remainSecs, totalSecs }) {
    const card = els.timerCard();
    const dot  = els.logoDot();
    const btn  = els.btnMain();

    card.classList.toggle('running', isRunning);
    card.classList.toggle('break-mode', mode === 'break');
    dot.classList.toggle('live', isRunning);

    if (isRunning) {
      btn.textContent = 'PAUSE';
      btn.className = 'btn btn-primary btn-lg';
      if (mode === 'break') btn.className = 'btn btn-blue btn-lg';
      btn.style.flex = '1';
    } else {
      btn.textContent = remainSecs < totalSecs ? 'RESUME' : 'START';
      btn.className = 'btn btn-surface btn-lg';
      if (mode === 'break') btn.classList.add('btn-blue-outline');
      btn.style.flex = '1';
      if (remainSecs === totalSecs) {
        btn.className = 'btn btn-primary btn-lg';
        if (mode === 'break') btn.className = 'btn btn-blue btn-lg';
        btn.style.flex = '1';
      }
    }

    syncPill();
  }

  function syncPill() {
    const pill = els.activePill();
    const text = els.pillText();
    const t = Store.getActiveTask();
    const { isRunning, mode } = Timer.getState();

    if (t && !t.done) {
      text.textContent = t.name;
      pill.classList.toggle('live', isRunning && mode === 'focus');
    } else {
      text.textContent = 'No Active Task';
      pill.classList.remove('live');
    }
  }

  /* ── mode tabs ────────────────────────────────────────── */
  function syncModeTabs(mode) {
    document.querySelectorAll('.mode-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
  }

  /* ── task list ────────────────────────────────────────── */
  function renderTasks(filter = 'all', callbacks = {}) {
    const list    = els.taskList();
    const scrollY = list.scrollTop; // preserve scroll

    const tasks    = Store.getTasks(filter);
    const allTasks = Store.getAllTasks();
    const activeId = Store.getActiveId();
    const tot = allTasks.length;
    const dn  = allTasks.filter(t => t.done).length;

    els.colMeta().textContent = `${tot} task${tot !== 1 ? 's' : ''} · ${dn} done`;

    if (tasks.length === 0) {
      list.innerHTML = `
        <div class="task-empty">
          <div class="empty-icon">🗂</div>
          <div class="empty-text">${filter === 'done' ? 'No completed tasks' : 'Add a task above'}</div>
        </div>`;
      return;
    }

    list.innerHTML = '';
    const { isRunning, mode } = Timer.getState();

    tasks.forEach(t => {
      const isActive  = t.id === activeId && !t.done;
      const isRunning_ = isActive && isRunning && mode === 'focus';

      const item = document.createElement('div');
      item.className = [
        'task-item anim-fade-up',
        t.done    ? 'is-done'   : '',
        isActive  ? 'is-active' : '',
      ].filter(Boolean).join(' ');

      /* status badge */
      let statusBadge = '';
      if (isRunning_) {
        statusBadge = `<span class="badge badge-accent">▶ running</span>`;
      } else if (isActive) {
        statusBadge = `<span class="badge badge-default">active</span>`;
      } else if (t.done) {
        statusBadge = `<span class="badge badge-default">done</span>`;
      }

      /* repeat count badge */
      const repeatBadge = t.repeatCount > 0
        ? `<span class="badge badge-orange">↺ ×${t.repeatCount}</span>`
        : '';

      item.innerHTML = `
        <div class="task-body">
          <div class="task-name">${_esc(t.name)}</div>
          <div class="task-badges">
            <span class="badge badge-default">${t.durMins}min</span>
            ${statusBadge}
            ${repeatBadge}
          </div>
        </div>
        <div class="task-actions">
          ${t.done
            ? `<button class="task-btn rep" title="Repeat task" data-id="${t.id}">↺</button>`
            : `<button class="task-btn" title="Focus on this task" data-id="${t.id}" data-action="select">▶</button>`
          }
          <button class="task-btn del" title="Delete" data-id="${t.id}" data-action="delete">×</button>
        </div>`;

      /* events */
      item.querySelector('[data-action="delete"]')
        ?.addEventListener('click', e => { e.stopPropagation(); callbacks.onDelete?.(t.id); });

      if (t.done) {
        item.querySelector('.rep')
          ?.addEventListener('click', e => { e.stopPropagation(); callbacks.onRepeat?.(t.id); });
      } else {
        item.querySelector('[data-action="select"]')
          ?.addEventListener('click', e => { e.stopPropagation(); callbacks.onSelect?.(t.id); });
        item.addEventListener('click', () => callbacks.onSelect?.(t.id));
      }

      list.appendChild(item);
    });

    list.scrollTop = scrollY; // restore scroll position
  }

  /* ── stats ────────────────────────────────────────────── */
  function renderStats() {
    const s = Store.getStats();
    els.hs1().textContent = s.sessions;
    els.hs2().textContent = s.mins >= 60
      ? `${Math.floor(s.mins/60)}h${s.mins%60?s.mins%60+'m':''}`
      : `${s.mins}m`;
    els.hs3().textContent = s.done;
  }

  /* ── alarm ────────────────────────────────────────────── */
  function showAlarm({ heading, sub, headingClass, onClose }) {
    const overlay = els.alarmOverlay();
    els.alarmHeading().textContent = heading;
    els.alarmHeading().className = `alarm-heading ${headingClass}`;
    els.alarmSub().textContent = sub;
    overlay.classList.add('open');

    let secs = 10;
    els.alarmCd().textContent = `Stopping in ${secs}s`;
    const tick = setInterval(() => {
      secs--;
      els.alarmCd().textContent = secs > 0 ? `Stopping in ${secs}s` : '';
      if (secs <= 0) { clearInterval(tick); _closeAlarm(onClose); }
    }, 1000);

    // stop button
    $('btn-stop-alarm').onclick = () => { clearInterval(tick); _closeAlarm(onClose); };
  }

  function _closeAlarm(onClose) {
    els.alarmOverlay().classList.remove('open');
    onClose?.();
  }

  /* ── sound panel ──────────────────────────────────────── */
  function syncSoundBtn(type, isPlaying) {
    document.querySelectorAll('.sound-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sound === type && isPlaying);
    });
  }

  function syncVolume(pct) {
    const fill  = $('vol-fill');
    const thumb = $('vol-thumb');
    const val   = $('vol-pct');
    const range = $('vol-range');
    if (!fill) return;
    fill.style.width   = pct + '%';
    thumb.style.left   = pct + '%';
    val.textContent    = pct + '%';
    range.value        = pct;
  }

  /* ── duration presets ─────────────────────────────────── */
  function syncDurPreset(mins) {
    document.querySelectorAll('.dur-preset').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.mins) === mins);
    });
  }

  /* ── helper ───────────────────────────────────────────── */
  function _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  return {
    syncTimer, syncPill, syncModeTabs,
    renderTasks, renderStats,
    showAlarm, syncSoundBtn, syncVolume, syncDurPreset,
  };
})();
