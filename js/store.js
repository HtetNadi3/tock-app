/* ============================================================
   store.js — App state & localStorage persistence
   ============================================================ */

const Store = (() => {
  const KEYS = { tasks: 'tock_tasks', stats: 'tock_stats', activeId: 'tock_aid' };

  /* ── defaults ─────────────────────────────────────────── */
  let _tasks    = [];
  let _stats    = { sessions: 0, mins: 0, done: 0 };
  let _activeId = null;

  /* ── load from localStorage ───────────────────────────── */
  function load() {
    try {
      _tasks    = JSON.parse(localStorage.getItem(KEYS.tasks))  || [];
      _stats    = JSON.parse(localStorage.getItem(KEYS.stats))  || { sessions:0, mins:0, done:0 };
      _activeId = localStorage.getItem(KEYS.activeId) || null;
      // ensure every task has required fields (migration safety)
      _tasks = _tasks.map(t => ({
        repeatCount: 0,
        ...t,
        done: !!t.done,
        durMins: t.durMins || 25,
      }));
    } catch(e) { console.warn('Store.load failed', e); }
  }

  /* ── persist ──────────────────────────────────────────── */
  function persist() {
    localStorage.setItem(KEYS.tasks,    JSON.stringify(_tasks));
    localStorage.setItem(KEYS.stats,    JSON.stringify(_stats));
    localStorage.setItem(KEYS.activeId, _activeId || '');
  }

  /* ── task helpers ─────────────────────────────────────── */
  function uid() { return Math.random().toString(36).slice(2, 9); }

  function addTask(name, durMins) {
    const task = {
      id: uid(), name: name.trim(),
      durMins: durMins || 25,
      done: false, repeatCount: 0,
      createdAt: Date.now(),
    };
    _tasks.unshift(task);
    // auto-select if nothing active or active task is done
    if (!_activeId || _tasks.find(t => t.id === _activeId)?.done) {
      _activeId = task.id;
    }
    persist();
    return task;
  }

  function deleteTask(id) {
  // Show the confirmation box
  const confirmed = confirm("Are you sure you want to delete this task?");

  // Only proceed if the user clicked "OK"
  if (confirmed) {
    _tasks = _tasks.filter(t => t.id !== id);
    
    if (_activeId === id) {
      _activeId = _tasks.find(t => !t.done)?.id || null;
    }
    
    persist();
  }
}

  function completeActive() {
    const t = _tasks.find(x => x.id === _activeId);
    if (t) {
      t.done = true;
      _stats.done++;
      _activeId = _tasks.find(x => !x.done)?.id || null;
    }
    persist();
    return t;
  }

  function repeatTask(id) {
    const t = _tasks.find(x => x.id === id);
    if (!t) return null;
    
    t.done = false;
    t.repeatCount = (t.repeatCount || 0) + 1;
    _tasks = [t, ..._tasks.filter(x => x.id !== id)];
    _activeId = t.id;
    
    persist();
    
    alert(`Task repeated! (Total: ${t.repeatCount})`);
    
    return t;
}

  function setActive(id) {
    const t = _tasks.find(x => x.id === id);
    if (!t || t.done) return null;
    _activeId = id;
    persist();
    return t;
  }

  function clearDone() {
    _tasks = _tasks.filter(t => !t.done);
    if (!_tasks.find(t => t.id === _activeId)) {
      _activeId = _tasks[0]?.id || null;
    }
    persist();
  }

  function recordSession(mins) {
    _stats.sessions++;
    _stats.mins += Math.round(mins);
    persist();
  }

  /* ── getters ──────────────────────────────────────────── */
  function getTasks(filter = 'all') {
    if (filter === 'active') return _tasks.filter(t => !t.done);
    if (filter === 'done')   return _tasks.filter(t =>  t.done);
    return [..._tasks];
  }

  function getActiveTask() { return _tasks.find(t => t.id === _activeId) || null; }
  function getStats()      { return { ..._stats }; }
  function getActiveId()   { return _activeId; }
  function getAllTasks()    { return [..._tasks]; }

  return {
    load, persist,
    addTask, deleteTask, completeActive, repeatTask, setActive, clearDone, recordSession,
    getTasks, getActiveTask, getStats, getActiveId, getAllTasks,
  };
})();
