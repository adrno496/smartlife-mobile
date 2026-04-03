// ============================================================
// app.js — SmartLife Pro — Logique complète de l'application
// ============================================================

'use strict';

/* ============================================================
   MODULE : StorageManager
   Gère toute la persistance via localStorage
   ============================================================ */
const StorageManager = {
  /**
   * Récupère une valeur depuis localStorage
   * @param {string} key
   * @param {*} defaultVal Valeur par défaut si clé absente
   */
  get(key, defaultVal = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultVal;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Erreur lecture "${key}":`, e);
      return defaultVal;
    }
  },

  /**
   * Persiste une valeur dans localStorage
   * @param {string} key
   * @param {*} data
   */
  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[Storage] Erreur écriture "${key}":`, e);
      if (typeof Toast !== 'undefined' && Toast.container) {
        Toast.show('Espace de stockage insuffisant.', 'error');
      }
      return false;
    }
  },

  /**
   * Met à jour une valeur via une fonction de transformation
   * @param {string} key
   * @param {function} fn Reçoit la valeur actuelle, retourne la nouvelle
   * @param {*} defaultVal Valeur initiale si absent
   */
  update(key, fn, defaultVal = null) {
    const current = this.get(key, defaultVal);
    const updated = fn(current);
    return this.set(key, updated);
  },

  /**
   * Supprime une clé
   * @param {string} key
   */
  clear(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  init() {
    // Vérification disponibilité localStorage
    try {
      localStorage.setItem('__spl_test__', '1');
      localStorage.removeItem('__spl_test__');
    } catch (e) {
      console.error('[Storage] localStorage non disponible !', e);
    }
  }
};

/* ============================================================
   MODULE : Toast
   Système de notifications contextuelles
   ============================================================ */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  /**
   * Affiche un toast
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration En ms (défaut 3200)
   */
  show(message, type = 'info', duration = 3200) {
    if (!this.container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ'}</div>
      <div class="toast-message">${message}</div>
    `;
    this.container.appendChild(el);

    // Auto-suppression
    const remove = () => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);

    // Clic pour fermer
    el.addEventListener('click', () => { clearTimeout(timer); remove(); });
  }
};

/* ============================================================
   MODULE : Router
   Navigation SPA entre les sections
   ============================================================ */
const Router = {
  activeSection: 'dashboard',

  sectionMeta: {
    dashboard: { title: 'Tableau de bord',   subtitle: 'Vue d\'ensemble de votre journée' },
    tasks:     { title: 'Mes Tâches',         subtitle: 'Gérez vos tâches et priorités' },
    habits:    { title: 'Tracker Habitudes',  subtitle: 'Construisez vos routines quotidiennes' },
    goals:     { title: 'Objectifs',          subtitle: 'Suivez votre objectif principal' },
    budget:    { title: 'Budget Personnel',   subtitle: 'Maîtrisez vos finances' },
    stats:     { title: 'Statistiques',       subtitle: 'Analysez vos performances' }
  },

  /**
   * Navigate vers une section
   * @param {string} section
   */
  navigate(section) {
    if (!this.sectionMeta[section]) return;

    // Masquer l'ancienne vue
    const prevView = document.getElementById(`view-${this.activeSection}`);
    if (prevView) prevView.classList.remove('active');

    // Mettre à jour nav
    this.activeSection = section;
    this.updateNav();

    // Afficher nouvelle vue
    const nextView = document.getElementById(`view-${section}`);
    if (nextView) {
      nextView.classList.add('active');
      // Re-déclencher l'animation
      nextView.style.animation = 'none';
      nextView.offsetHeight; // Reflow
      nextView.style.animation = '';
    }

    // Mettre à jour topbar
    const meta = this.sectionMeta[section];
    document.getElementById('topbar-title').textContent    = meta.title;
    document.getElementById('topbar-subtitle').textContent = meta.subtitle;

    // Rafraîchir le contenu de la section
    this.refreshSection(section);
  },

  updateNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.nav === this.activeSection);
    });
  },

  refreshSection(section) {
    switch (section) {
      case 'dashboard': Dashboard.render();       break;
      case 'tasks':     TaskManager.renderList(); break;
      case 'habits':    HabitTracker.renderList(); break;
      case 'goals':     GoalManager.render();     break;
      case 'budget':    BudgetManager.render();   break;
      case 'stats':     StatsEngine.render();     break;
    }
  },

  init() {
    // Délégation événement sur tous les .nav-item
    document.querySelectorAll('.nav-item[data-nav]').forEach(item => {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', () => this.navigate(item.dataset.nav));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigate(item.dataset.nav);
        }
      });
    });

    // Naviguer vers le dashboard par défaut
    this.navigate('dashboard');
  }
};

/* ============================================================
   MODULE : MotivationEngine
   Citations motivationnelles
   ============================================================ */
const MotivationEngine = {
  quotes: [
    { text: "Le succès, c'est d'aller d'échec en échec sans perdre son enthousiasme.",        author: "Winston Churchill" },
    { text: "La seule façon de faire du bon travail est d'aimer ce que vous faites.",          author: "Steve Jobs" },
    { text: "Ne compte pas les jours, fais que les jours comptent.",                           author: "Muhammad Ali" },
    { text: "La discipline est le pont entre les objectifs et les accomplissements.",           author: "Jim Rohn" },
    { text: "Vous ne pouvez pas retourner en arrière et changer le début, mais vous pouvez recommencer et changer la fin.", author: "C.S. Lewis" },
    { text: "Un voyage de mille lieues commence par un premier pas.",                          author: "Lao Tseu" },
    { text: "La vie n'est pas de trouver qui on est, c'est de créer qui on veut être.",        author: "George Bernard Shaw" },
    { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment, c'est maintenant.", author: "Proverbe chinois" },
    { text: "Croyez en vous et tout devient possible.",                                        author: "Charles de Gaulle" },
    { text: "Chaque expert a été un débutant un jour.",                                        author: "Helen Hayes" },
    { text: "Les personnes qui réussissent ont la discipline de faire les choses qu'elles n'aiment pas faire.", author: "Jim Rohn" },
    { text: "Concentrez-vous sur l'effort, pas sur le résultat.",                             author: "Bill Murray" },
    { text: "Votre temps est limité, ne le gâchez pas à vivre la vie de quelqu'un d'autre.",  author: "Steve Jobs" },
    { text: "Le bonheur n'est pas quelque chose que l'on reporte à plus tard ; il se vit dans le présent.", author: "Jim Rohn" },
    { text: "Soyez le changement que vous voulez voir dans le monde.",                         author: "Gandhi" }
  ],

  getRandom() {
    return this.quotes[Math.floor(Math.random() * this.quotes.length)];
  },

  init() {}
};

/* ============================================================
   MODULE : Dashboard
   Rendu du tableau de bord
   ============================================================ */
const Dashboard = {
  render() {
    this.renderStats();
    this.renderQuote();
    this.renderTodayTasks();
    this.renderStreak();
  },

  renderStats() {
    const grid = document.getElementById('dashboard-stats-grid');
    if (!grid) return;

    const tasks   = TaskManager.getAll();
    const done    = tasks.filter(t => t.status === 'done').length;
    const total   = tasks.length;
    const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

    const goal    = GoalManager.get();
    const goalPct = goal ? goal.progress : 0;

    const budget  = BudgetManager.calcTotals();
    const solde   = budget.income - budget.expenses;

    const score   = HabitTracker.calcScore();

    grid.innerHTML = `
      ${this._statCard('✅', 'Tâches complétées', `${done}/${total}`, 'accent',
        `<div class="progress-wrap mt-3"><div class="progress-bar" style="width:${pct}%"></div></div>
         <div style="font-size:11px;color:var(--text-3);margin-top:6px;">${pct}% de complétion</div>`)}

      ${this._statCard('🎯', 'Objectif principal', `${goalPct}%`, goal && goalPct >= 100 ? 'success' : 'accent',
        `<div class="progress-wrap mt-3"><div class="progress-bar ${goalPct >= 100 ? 'success' : ''}" style="width:${goalPct}%"></div></div>
         <div style="font-size:11px;color:var(--text-3);margin-top:6px;">${goal ? (goal.title.length > 30 ? goal.title.substring(0, 30) + '…' : goal.title) : 'Aucun objectif'}</div>`)}

      ${this._statCard('💰', 'Solde du mois', `${solde >= 0 ? '+' : ''}${solde.toFixed(0)} €`,
        solde >= 0 ? 'success' : 'danger',
        `<div style="font-size:11px;color:var(--text-3);margin-top:8px;">Revenus: ${budget.income.toFixed(0)}€ | Dépenses: ${budget.expenses.toFixed(0)}€</div>`)}

      ${this._scoreCard(score)}
    `;
  },

  _statCard(icon, label, value, colorClass, extra = '') {
    return `
      <div class="card">
        <div class="card-title"><span class="card-title-icon">${icon}</span> ${label}</div>
        <div class="stat-value ${colorClass}" style="margin-top:12px;">${value}</div>
        ${extra}
      </div>
    `;
  },

  _scoreCard(score) {
    const r = 42; const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

    return `
      <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
        <div class="card-title"><span>🔥</span> Score Discipline</div>
        <div class="ring-container" style="margin-top:8px;">
          <svg width="110" height="110" class="chart-svg">
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--bg-input)" stroke-width="10"/>
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="${color}" stroke-width="10"
              stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
              stroke-linecap="round"
              transform="rotate(-90 55 55)"
              style="transition:stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)"/>
          </svg>
          <div class="ring-label">
            <span class="ring-pct">${score}%</span>
            <span class="ring-sublabel">Discipline</span>
          </div>
        </div>
      </div>
    `;
  },

  renderQuote() {
    const q = MotivationEngine.getRandom();
    const textEl   = document.getElementById('dash-quote-text');
    const authorEl = document.getElementById('dash-quote-author');
    if (textEl)   textEl.textContent   = q.text;
    if (authorEl) authorEl.textContent = `— ${q.author}`;
  },

  renderTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = TaskManager.getAll().filter(t =>
      t.status !== 'done' &&
      (t.dueDate === today || !t.dueDate)
    ).slice(0, 6);

    const list  = document.getElementById('dash-tasks-list');
    const count = document.getElementById('dash-tasks-count');
    if (!list) return;

    if (count) count.textContent = tasks.length;

    if (tasks.length === 0) {
      list.innerHTML = `<div class="empty-state" style="padding:16px 0;">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-sub">Tout est fait pour aujourd'hui !</div>
      </div>`;
      return;
    }

    const priorityColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--accent)' };
    list.innerHTML = tasks.map(t => `
      <div class="dash-task-item">
        <div class="dash-task-dot" style="background:${priorityColors[t.priority] || 'var(--accent)'}"></div>
        <div class="dash-task-name">${escHtml(t.title)}</div>
      </div>
    `).join('');
  },

  renderStreak() {
    const streak = HabitTracker.calcGlobalStreak();
    const el = document.getElementById('dash-streak-count');
    if (el) el.textContent = streak;
  },

  refreshWidgets() { this.render(); },
  init() {}
};

/* ============================================================
   MODULE : TaskManager
   Gestion complète des tâches (CRUD + filtres)
   ============================================================ */
const TaskManager = {
  STORAGE_KEY: 'spl_tasks',
  currentFilter: 'all',
  currentSort: 'date_created',

  getAll() {
    return StorageManager.get(this.STORAGE_KEY, []);
  },

  /**
   * Ajoute une nouvelle tâche
   */
  add(task) {
    const newTask = {
      id:          genId(),
      title:       task.title.trim(),
      priority:    task.priority   || 'medium',
      dueDate:     task.dueDate    || null,
      status:      'pending',
      createdAt:   new Date().toISOString()
    };
    StorageManager.update(this.STORAGE_KEY, list => [...(list || []), newTask], []);
    return newTask;
  },

  /**
   * Met à jour une tâche existante
   * @param {string} id
   * @param {object} patch
   */
  update(id, patch) {
    StorageManager.update(this.STORAGE_KEY, list =>
      (list || []).map(t => t.id === id ? { ...t, ...patch } : t), []
    );
  },

  /**
   * Supprime une tâche
   */
  delete(id) {
    StorageManager.update(this.STORAGE_KEY, list =>
      (list || []).filter(t => t.id !== id), []
    );
  },

  /**
   * Filtre les tâches selon le critère actif
   */
  filter(type) {
    const today = new Date().toISOString().split('T')[0];
    const all   = this.getAll();

    switch (type) {
      case 'today':   return all.filter(t => t.dueDate === today);
      case 'done':    return all.filter(t => t.status === 'done');
      case 'pending': return all.filter(t => t.status !== 'done');
      default:        return all;
    }
  },

  /**
   * Trie un tableau de tâches
   */
  sort(list, by) {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => {
      if (by === 'priority')    return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
      if (by === 'due_date')    return (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1;
      return a.createdAt < b.createdAt ? -1 : 1; // date_created
    });
  },

  renderList() {
    const list    = document.getElementById('tasks-list');
    const counter = document.getElementById('tasks-counter');
    if (!list) return;

    const all     = this.getAll();
    const done    = all.filter(t => t.status === 'done').length;
    if (counter) counter.textContent = `${done} / ${all.length}`;

    let tasks = this.filter(this.currentFilter);
    tasks     = this.sort(tasks, this.currentSort);

    if (tasks.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">Aucune tâche ici</div>
        <div class="empty-state-sub">Ajoutez votre première tâche !</div>
      </div>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const priorityLabels = { high: '🔴 Haute', medium: '⚡ Moyenne', low: '🔵 Basse' };
    const priorityBadges = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

    list.innerHTML = tasks.map(t => {
      const isOverdue = t.dueDate && t.dueDate < today && t.status !== 'done';
      const dateStr   = t.dueDate ? formatDate(t.dueDate) : '';
      return `
        <div class="task-item ${t.status === 'done' ? 'done' : ''}" data-task-id="${t.id}">
          <div class="task-check ${t.status === 'done' ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}"></div>
          <div class="task-body">
            <div class="task-title">${escHtml(t.title)}</div>
            <div class="task-meta">
              <span class="badge ${priorityBadges[t.priority] || 'badge-neutral'}">${priorityLabels[t.priority] || t.priority}</span>
              ${dateStr ? `<span class="task-date ${isOverdue ? 'overdue' : ''}">📅 ${dateStr}${isOverdue ? ' · En retard' : ''}</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="btn btn-icon" data-action="edit-task" data-id="${t.id}" title="Modifier">✏️</button>
            <button class="btn btn-icon" data-action="delete-task" data-id="${t.id}" title="Supprimer">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openModal(id = null) {
    const modal = document.getElementById('modal-task');
    const titleEl = document.getElementById('modal-task-title');
    const inputTitle    = document.getElementById('task-input-title');
    const inputPriority = document.getElementById('task-input-priority');
    const inputDate     = document.getElementById('task-input-date');
    const editId        = document.getElementById('task-edit-id');

    if (id) {
      const task = this.getAll().find(t => t.id === id);
      if (!task) return;
      titleEl.textContent        = 'Modifier la tâche';
      inputTitle.value           = task.title;
      inputPriority.value        = task.priority;
      inputDate.value            = task.dueDate || '';
      editId.value               = id;
    } else {
      titleEl.textContent  = 'Nouvelle tâche';
      inputTitle.value     = '';
      inputPriority.value  = 'medium';
      inputDate.value      = '';
      editId.value         = '';
    }

    modal.classList.add('open');
    setTimeout(() => inputTitle.focus(), 100);
  },

  saveFromModal() {
    const title    = document.getElementById('task-input-title').value.trim();
    const priority = document.getElementById('task-input-priority').value;
    const dueDate  = document.getElementById('task-input-date').value || null;
    const editId   = document.getElementById('task-edit-id').value;

    if (!title) { Toast.show('Le titre est requis.', 'error'); return; }

    if (editId) {
      this.update(editId, { title, priority, dueDate });
      Toast.show('Tâche modifiée !', 'success');
    } else {
      this.add({ title, priority, dueDate });
      Toast.show('Tâche ajoutée !', 'success');
    }

    closeModal('modal-task');
    this.renderList();
    Dashboard.refreshWidgets();
  },

  init() {
    // Tri
    const sortEl = document.getElementById('task-sort');
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        this.currentSort = sortEl.value;
        this.renderList();
      });
    }
  }
};

/* ============================================================
   MODULE : HabitTracker
   Suivi des habitudes avec streaks et score discipline
   ============================================================ */
const HabitTracker = {
  STORAGE_KEY:     'spl_habits',
  STORAGE_LOG_KEY: 'spl_habits_log',

  getAll() { return StorageManager.get(this.STORAGE_KEY, []); },
  getLog()  { return StorageManager.get(this.STORAGE_LOG_KEY, {}); },

  add(habit) {
    const newHabit = {
      id:        genId(),
      name:      habit.name.trim(),
      emoji:     habit.emoji  || '💪',
      frequency: habit.frequency || 'daily',
      createdAt: new Date().toISOString()
    };
    StorageManager.update(this.STORAGE_KEY, list => [...(list || []), newHabit], []);
    return newHabit;
  },

  delete(id) {
    StorageManager.update(this.STORAGE_KEY, list => (list || []).filter(h => h.id !== id), []);
    // Nettoyer le log
    StorageManager.update(this.STORAGE_LOG_KEY, log => {
      const cleaned = { ...log };
      delete cleaned[id];
      return cleaned;
    }, {});
  },

  /**
   * Marque l'habitude comme faite aujourd'hui
   */
  markToday(id) {
    const today = new Date().toISOString().split('T')[0];
    StorageManager.update(this.STORAGE_LOG_KEY, log => {
      const updated = { ...(log || {}) };
      if (!updated[id]) updated[id] = [];
      if (!updated[id].includes(today)) {
        updated[id] = [...updated[id], today];
      }
      return updated;
    }, {});
  },

  /**
   * Vérifie si une habitude a été faite aujourd'hui
   */
  isDoneToday(id) {
    const today = new Date().toISOString().split('T')[0];
    const log   = this.getLog();
    return (log[id] || []).includes(today);
  },

  /**
   * Calcule le streak d'une habitude (jours consécutifs jusqu'à aujourd'hui)
   */
  calcStreak(habit) {
    const log    = this.getLog();
    const dates  = (log[habit.id] || []).sort().reverse();
    if (dates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      if (dates.includes(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Tolérance : sauter aujourd'hui si pas encore fait
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  },

  /**
   * Score discipline global : % d'habitudes faites aujourd'hui
   */
  calcScore() {
    const habits = this.getAll();
    if (habits.length === 0) return 0;
    const done = habits.filter(h => this.isDoneToday(h.id)).length;
    return Math.round((done / habits.length) * 100);
  },

  /**
   * Streak global : plus long streak parmi toutes les habitudes
   */
  calcGlobalStreak() {
    const habits = this.getAll();
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => this.calcStreak(h)));
  },

  /**
   * Retourne les 7 derniers jours (YYYY-MM-DD)
   */
  getLast7Days() {
    const today = new Date().toISOString().split('T')[0];
    if (this._last7Cache?.date === today) return this._last7Cache.days;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    this._last7Cache = { date: today, days };
    return days;
  },

  renderList() {
    const container = document.getElementById('habits-list');
    const scoreEl   = document.getElementById('habits-score');
    if (!container) return;

    const habits = this.getAll();   // 1 seule lecture
    const log    = this.getLog();   // 1 seule lecture

    const today = new Date().toISOString().split('T')[0];
    const score = habits.length === 0 ? 0
      : Math.round(habits.filter(h => (log[h.id] || []).includes(today)).length / habits.length * 100);

    if (scoreEl) scoreEl.textContent = `${score}%`;

    if (habits.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">🌱</div>
        <div class="empty-state-text">Aucune habitude créée</div>
        <div class="empty-state-sub">Commencez par ajouter une habitude quotidienne.</div>
      </div>`;
      return;
    }

    const days = this.getLast7Days();

    container.innerHTML = habits.map(h => {
      const streak    = this.calcStreak(h);
      const doneToday = (log[h.id] || []).includes(today);
      const logDates  = log[h.id] || [];

      const dotsHtml = days.map(d => {
        const cls = logDates.includes(d) ? 'done' : 'missed';
        return `<div class="habit-day-dot ${cls}" title="${d}"></div>`;
      }).join('');

      return `
        <div class="habit-item" data-habit-id="${h.id}">
          <div class="habit-icon-wrap">${h.emoji}</div>
          <div class="habit-info">
            <div class="habit-name">${escHtml(h.name)}</div>
            <div class="habit-streak">Streak : <span>${streak} jour${streak > 1 ? 's' : ''}</span> 🔥</div>
            <div class="habit-week-grid mt-2">${dotsHtml}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <button class="btn btn-success btn-sm" data-action="mark-habit" data-id="${h.id}" ${doneToday ? 'disabled' : ''}>
              ${doneToday ? '✅ Fait' : '✓ Fait aujourd\'hui'}
            </button>
            <button class="btn btn-icon btn-sm" data-action="delete-habit" data-id="${h.id}" title="Supprimer">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  openModal() {
    const modal = document.getElementById('modal-habit');
    document.getElementById('habit-input-name').value = '';
    document.getElementById('habit-input-freq').value = 'daily';
    // Reset sélection emoji
    document.querySelectorAll('#habit-emoji-picker .emoji-option').forEach(e => {
      e.classList.toggle('selected', e.dataset.emoji === '💪');
    });
    modal.classList.add('open');
    setTimeout(() => document.getElementById('habit-input-name').focus(), 100);
  },

  saveFromModal() {
    const name  = document.getElementById('habit-input-name').value.trim();
    const freq  = document.getElementById('habit-input-freq').value;
    const emoji = document.querySelector('#habit-emoji-picker .emoji-option.selected')?.dataset.emoji || '💪';

    if (!name) { Toast.show('Le nom est requis.', 'error'); return; }

    this.add({ name, emoji, frequency: freq });
    Toast.show('Habitude créée !', 'success');
    closeModal('modal-habit');
    this.renderList();
    Dashboard.refreshWidgets();
  },

  init() {
    // Emoji picker
    document.addEventListener('click', e => {
      const emojiOpt = e.target.closest('#habit-emoji-picker .emoji-option');
      if (emojiOpt) {
        document.querySelectorAll('#habit-emoji-picker .emoji-option').forEach(el => el.classList.remove('selected'));
        emojiOpt.classList.add('selected');
      }
    });
  }
};

/* ============================================================
   MODULE : GoalManager
   Gestion de l'objectif principal + sous-objectifs
   ============================================================ */
const GoalManager = {
  STORAGE_KEY: 'spl_goals',

  get() {
    return StorageManager.get(this.STORAGE_KEY, null);
  },

  set(goal) {
    StorageManager.set(this.STORAGE_KEY, goal);
  },

  updateProgress(val) {
    const goal = this.get();
    if (!goal) return;
    goal.progress = Math.min(100, Math.max(0, val));
    this.set(goal);
  },

  toggleSub(index) {
    const goal = this.get();
    if (!goal || !goal.subs[index]) return;
    goal.subs[index].done = !goal.subs[index].done;

    // Recalcul auto % si sous-objectifs présents
    if (goal.subs.length > 0) {
      const done = goal.subs.filter(s => s.done).length;
      goal.progress = Math.round((done / goal.subs.length) * 100);
    }
    this.set(goal);
  },

  getStatus(goal) {
    if (!goal) return null;
    if (goal.progress >= 100) return { label: 'Atteint ✅',   cls: 'badge-success' };
    if (goal.deadline && goal.deadline < new Date().toISOString().split('T')[0])
      return { label: 'En retard ⚠️', cls: 'badge-medium' };
    return { label: 'En cours 🚀', cls: 'badge-info' };
  },

  render() {
    const container = document.getElementById('goal-hero-container');
    const subsContainer = document.getElementById('goal-subs-container');
    if (!container) return;

    const goal = this.get();

    if (!goal) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-text">Aucun objectif défini</div>
        <div class="empty-state-sub">Configurez votre objectif principal pour commencer.</div>
        <button class="btn btn-primary mt-4" id="btn-create-goal">Créer mon objectif</button>
      </div>`;
      if (subsContainer) subsContainer.innerHTML = '';
      return;
    }

    const status  = this.getStatus(goal);
    const pct     = goal.progress || 0;
    const barColor = pct >= 100 ? 'success' : pct >= 70 ? 'accent' : pct >= 30 ? '' : 'danger';

    container.innerHTML = `
      <div class="goal-hero">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
          <div>
            <span class="badge ${status.cls}" style="margin-bottom:8px;">${status.label}</span>
            <div class="goal-title-big">${escHtml(goal.title)}</div>
          </div>
        </div>
        ${goal.description ? `<div class="goal-desc">${escHtml(goal.description)}</div>` : ''}
        ${goal.deadline ? `<div class="goal-deadline">📅 Échéance : ${formatDate(goal.deadline)}</div>` : ''}

        <div class="progress-label">
          <span style="font-size:14px;font-weight:600;color:var(--text-2);">Progression</span>
          <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-wrap" style="height:12px;">
          <div class="progress-bar ${barColor}" style="width:${pct}%;"></div>
        </div>

        ${goal.subs.length === 0 ? `
          <div style="margin-top:20px;display:flex;align-items:center;gap:12px;">
            <label style="font-size:13px;color:var(--text-2);">Avancement manuel :</label>
            <input type="range" id="goal-progress-range" min="0" max="100" value="${pct}"
              style="flex:1;accent-color:var(--accent);" />
            <span id="goal-range-val" style="font-family:var(--font-mono);font-size:13px;color:var(--accent);min-width:36px;">${pct}%</span>
          </div>
        ` : ''}
      </div>
    `;

    // Sous-objectifs
    if (subsContainer) {
      if (goal.subs.length > 0) {
        subsContainer.innerHTML = `
          <div style="font-size:15px;font-weight:700;color:var(--text-1);margin-bottom:12px;">
            Sous-objectifs (${goal.subs.filter(s=>s.done).length}/${goal.subs.length})
          </div>
          <div class="sub-goals">
            ${goal.subs.map((s, i) => `
              <div class="sub-goal-item ${s.done ? 'checked' : ''}" data-action="toggle-sub" data-index="${i}">
                <div class="sub-goal-check"></div>
                <div class="sub-goal-text">${escHtml(s.title)}</div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        subsContainer.innerHTML = '';
      }
    }

    // Range listener
    const range = document.getElementById('goal-progress-range');
    const rangeVal = document.getElementById('goal-range-val');
    if (range) {
      range.addEventListener('input', () => {
        const v = parseInt(range.value);
        if (rangeVal) rangeVal.textContent = `${v}%`;
        this.updateProgress(v);
        // Mise à jour barre en direct
        const bar = container.querySelector('.progress-bar');
        if (bar) bar.style.width = `${v}%`;
        const pctEl = container.querySelector('.progress-pct');
        if (pctEl) pctEl.textContent = `${v}%`;
      });
    }
  },

  openModal() {
    const modal = document.getElementById('modal-goal');
    const goal  = this.get();

    document.getElementById('goal-input-title').value    = goal?.title || '';
    document.getElementById('goal-input-desc').value     = goal?.description || '';
    document.getElementById('goal-input-deadline').value = goal?.deadline || '';
    document.getElementById('goal-input-progress').value = goal?.progress || 0;

    // Sous-objectifs
    const subsContainer = document.getElementById('sub-goals-inputs');
    const subs = goal?.subs || [];
    this._renderSubInputs(subsContainer, subs);

    modal.classList.add('open');
    setTimeout(() => document.getElementById('goal-input-title').focus(), 100);
  },

  _renderSubInputs(container, subs) {
    container.innerHTML = subs.map((s, i) => `
      <div style="display:flex;gap:8px;margin-bottom:8px;" data-sub-index="${i}">
        <input type="text" class="form-input sub-goal-input" value="${escHtml(s.title)}" placeholder="Sous-objectif ${i+1}…" />
        <button class="btn btn-icon" data-action="remove-sub" data-index="${i}">✕</button>
      </div>
    `).join('');
  },

  addSubInput() {
    const container = document.getElementById('sub-goals-inputs');
    const count = container.querySelectorAll('.sub-goal-input').length;
    if (count >= 5) { Toast.show('Maximum 5 sous-objectifs.', 'warning'); return; }
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
    div.setAttribute('data-sub-index', count);
    div.innerHTML = `
      <input type="text" class="form-input sub-goal-input" placeholder="Sous-objectif ${count+1}…" />
      <button class="btn btn-icon" data-action="remove-sub" data-index="${count}">✕</button>
    `;
    container.appendChild(div);
    div.querySelector('input').focus();
  },

  removeSubInput(index) {
    const container = document.getElementById('sub-goals-inputs');
    const items     = container.querySelectorAll('[data-sub-index]');
    if (items[index]) items[index].remove();
    // Renuméroter
    container.querySelectorAll('[data-sub-index]').forEach((el, i) => {
      el.setAttribute('data-sub-index', i);
      const btn = el.querySelector('[data-action="remove-sub"]');
      if (btn) btn.dataset.index = i;
    });
  },

  saveFromModal() {
    const title    = document.getElementById('goal-input-title').value.trim();
    const desc     = document.getElementById('goal-input-desc').value.trim();
    const deadline = document.getElementById('goal-input-deadline').value || null;
    let   progress = parseInt(document.getElementById('goal-input-progress').value) || 0;

    if (!title) { Toast.show('Le titre est requis.', 'error'); return; }
    progress = Math.min(100, Math.max(0, progress));

    // Récupérer les sous-objectifs
    const existing  = this.get();
    const subInputs = document.querySelectorAll('.sub-goal-input');
    const subs = Array.from(subInputs)
      .map((inp) => {
        const trimmed = inp.value.trim();
        const match = existing?.subs?.find(s => s.title === trimmed);
        return { title: trimmed, done: match?.done || false };
      })
      .filter(s => s.title !== '');

    // Recalcul auto si sous-objectifs
    if (subs.length > 0) {
      const done = subs.filter(s => s.done).length;
      progress = Math.round((done / subs.length) * 100);
    }

    this.set({ title, description: desc, deadline, progress, subs });
    Toast.show('Objectif enregistré !', 'success');
    closeModal('modal-goal');
    this.render();
    Dashboard.refreshWidgets();
  },

  init() {}
};

/* ============================================================
   MODULE : BudgetManager
   Gestion du budget : transactions, totaux, catégories
   ============================================================ */
const BudgetManager = {
  STORAGE_KEY: 'spl_budget',

  getAll() { return StorageManager.get(this.STORAGE_KEY, []); },

  add(entry) {
    const newEntry = {
      id:        genId(),
      label:     entry.label.trim(),
      amount:    parseFloat(entry.amount),
      type:      entry.type || 'expense',
      category:  entry.category || 'Autre',
      date:      new Date().toISOString()
    };
    StorageManager.update(this.STORAGE_KEY, list => [...(list || []), newEntry], []);
    return newEntry;
  },

  delete(id) {
    StorageManager.update(this.STORAGE_KEY, list => (list || []).filter(e => e.id !== id), []);
  },

  calcTotals() {
    const entries  = this.getAll();
    const income   = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { income, expenses, balance: income - expenses };
  },

  calcByCategory() {
    const entries   = this.getAll().filter(e => e.type === 'expense');
    const total     = entries.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};

    entries.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return Object.entries(byCategory)
      .map(([name, amount]) => ({ name, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  },

  render() {
    this.renderSummary();
    this.renderTransactions();
    this.renderCategories();
  },

  renderSummary() {
    const container = document.getElementById('budget-summary');
    if (!container) return;
    const { income, expenses, balance } = this.calcTotals();

    container.innerHTML = `
      ${this._summaryCard('💚', 'Total Revenus', income, 'success')}
      ${this._summaryCard('💸', 'Total Dépenses', expenses, 'danger')}
      ${this._summaryCard('💰', 'Solde', balance, balance >= 0 ? 'success' : 'danger')}
    `;
  },

  _summaryCard(icon, label, amount, colorClass) {
    return `
      <div class="card">
        <div class="card-title"><span>${icon}</span> ${label}</div>
        <div class="stat-value ${colorClass}" style="margin-top:10px;">${amount.toFixed(2)} €</div>
      </div>
    `;
  },

  renderTransactions() {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    const entries = [...this.getAll()].sort((a, b) => b.date.localeCompare(a.date));

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">💳</div>
        <div class="empty-state-text">Aucune transaction</div>
        <div class="empty-state-sub">Ajoutez vos revenus et dépenses.</div>
      </div>`;
      return;
    }

    const catEmojis = {
      Logement: '🏠', Alimentation: '🥦', Transport: '🚗',
      Loisirs: '🎮', Santé: '💊', Autre: '📦', Revenu: '💼'
    };

    container.innerHTML = entries.map(e => `
      <div class="transaction-item" data-tx-id="${e.id}">
        <div class="transaction-type ${e.type}">
          ${catEmojis[e.category] || '📦'}
        </div>
        <div class="transaction-info">
          <div class="transaction-label">${escHtml(e.label)}</div>
          <div class="transaction-meta">${e.category} · ${formatDateFull(e.date)}</div>
        </div>
        <div class="transaction-amount ${e.type}">
          ${e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)} €
        </div>
        <button class="btn btn-icon" data-action="delete-tx" data-id="${e.id}" title="Supprimer">🗑️</button>
      </div>
    `).join('');
  },

  renderCategories() {
    const container = document.getElementById('category-bars');
    if (!container) return;

    const cats = this.calcByCategory();
    if (cats.length === 0) {
      container.innerHTML = `<div style="color:var(--text-3);font-size:13px;">Aucune dépense enregistrée.</div>`;
      return;
    }

    const colors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--text-2)'];
    container.innerHTML = cats.map((cat, i) => `
      <div class="category-bar-item">
        <div class="category-bar-header">
          <span class="category-bar-name">${cat.name}</span>
          <span class="category-bar-pct">${cat.pct}% · ${cat.amount.toFixed(0)}€</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${cat.pct}%;background:${colors[i % colors.length]};"></div>
        </div>
      </div>
    `).join('');
  },

  openModal() {
    const modal = document.getElementById('modal-transaction');
    document.getElementById('tx-input-label').value    = '';
    document.getElementById('tx-input-amount').value   = '';
    document.getElementById('tx-input-type').value     = 'expense';
    document.getElementById('tx-input-category').value = 'Alimentation';
    modal.classList.add('open');
    setTimeout(() => document.getElementById('tx-input-label').focus(), 100);
  },

  saveFromModal() {
    const label    = document.getElementById('tx-input-label').value.trim();
    const amount   = parseFloat(document.getElementById('tx-input-amount').value);
    const type     = document.getElementById('tx-input-type').value;
    const category = document.getElementById('tx-input-category').value;

    if (!label)            { Toast.show('Le libellé est requis.', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { Toast.show('Montant invalide.', 'error'); return; }

    this.add({ label, amount, type, category });
    Toast.show('Transaction enregistrée !', 'success');
    closeModal('modal-transaction');
    this.render();
    Dashboard.refreshWidgets();
  },

  init() {}
};

/* ============================================================
   MODULE : StatsEngine
   Calcule et affiche toutes les statistiques
   ============================================================ */
const StatsEngine = {
  compute() {
    const tasks   = TaskManager.getAll();
    const habits  = HabitTracker.getAll();
    const log     = HabitTracker.getLog();
    const budget  = BudgetManager.getAll();

    // === TÂCHES ===
    const totalTasks = tasks.length;
    const doneTasks  = tasks.filter(t => t.status === 'done').length;
    const taskRate   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Tâches complétées cette semaine
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekDone = tasks.filter(t => t.status === 'done' && new Date(t.createdAt) >= weekAgo).length;

    // === HABITUDES ===
    const bestStreak = habits.length > 0
      ? Math.max(...habits.map(h => HabitTracker.calcStreak(h)))
      : 0;

    const days7 = HabitTracker.getLast7Days();
    const score7 = habits.length > 0 ? Math.round(
      days7.reduce((sum, day) => {
        const doneCount = habits.filter(h => (log[h.id] || []).includes(day)).length;
        return sum + (doneCount / habits.length) * 100;
      }, 0) / 7
    ) : 0;

    // === BUDGET ===
    const expenses = budget.filter(e => e.type === 'expense');
    const months = {};
    expenses.forEach(e => {
      const m = e.date.substring(0, 7);
      months[m] = (months[m] || 0) + e.amount;
    });
    const monthVals = Object.values(months);
    const avgMonthly = monthVals.length > 0
      ? Math.round(monthVals.reduce((s, v) => s + v, 0) / monthVals.length)
      : 0;

    const cats = BudgetManager.calcByCategory();
    const topCat = cats[0] || null;

    return {
      tasks:  { total: totalTasks, done: doneTasks, rate: taskRate, weekDone },
      habits: { bestStreak, score7, total: habits.length },
      budget: { avgMonthly, topCat, totalExpenses: expenses.reduce((s,e)=>s+e.amount,0) }
    };
  },

  render() {
    const metrics = this.compute();
    this._renderMetrics(metrics);
    this._renderTasksChart();
    this._renderHabitsChart();
    this._renderBudgetChart();
  },

  _renderMetrics(m) {
    const container = document.getElementById('stats-metrics');
    if (!container) return;

    container.innerHTML = `
      ${this._metricCard('✅', 'Tâches complétées', m.tasks.done, 'Total', m.tasks.total, `Taux : ${m.tasks.rate}%`)}
      ${this._metricCard('📈', 'Tâches cette semaine', m.tasks.weekDone, 'Complétées', '', `Taux global : ${m.tasks.rate}%`)}
      ${this._metricCard('🔥', 'Meilleur streak', m.habits.bestStreak, 'jours consécutifs', '', `${m.habits.total} habitude(s) suivie(s)`)}
      ${this._metricCard('💪', 'Score moyen 7j', `${m.habits.score7}%`, 'Discipline', '', 'Sur les 7 derniers jours')}
      ${this._metricCard('💸', 'Dépenses moyennes', `${m.budget.avgMonthly}€`, 'Par mois', '', 'Basé sur l\'historique')}
      ${this._metricCard('📦', 'Catégorie principale', m.budget.topCat?.name || 'N/A', m.budget.topCat ? `${m.budget.topCat.pct}%` : '', '', m.budget.topCat ? `${m.budget.topCat.amount.toFixed(0)} €` : 'Aucune dépense')}
    `;
  },

  _metricCard(icon, label, value, sub, sub2, note) {
    return `
      <div class="card">
        <div class="card-title"><span>${icon}</span> ${label}</div>
        <div style="margin-top:10px;">
          <div style="font-size:28px;font-weight:700;color:var(--text-1);letter-spacing:-1px;">${value}</div>
          <div style="font-size:12px;color:var(--text-2);margin-top:4px;">${sub} ${sub2 ? '· ' + sub2 : ''}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:6px;">${note}</div>
        </div>
      </div>
    `;
  },

  _renderTasksChart() {
    const container = document.getElementById('chart-tasks');
    if (!container) return;

    const tasks = TaskManager.getAll();
    const days  = HabitTracker.getLast7Days();
    const dayLabels = days.map(d => d.split('-')[2]); // Jour du mois

    const counts = days.map(d =>
      tasks.filter(t => t.completedAt && t.completedAt.startsWith(d)).length
    );

    container.innerHTML = this._barChart(counts, dayLabels, 'var(--accent)');
  },

  _renderHabitsChart() {
    const container = document.getElementById('chart-habits');
    if (!container) return;

    const habits = HabitTracker.getAll();
    const log    = HabitTracker.getLog();
    const days   = HabitTracker.getLast7Days();
    const dayLabels = days.map(d => d.split('-')[2]);

    const counts = days.map(d =>
      habits.filter(h => (log[h.id] || []).includes(d)).length
    );

    container.innerHTML = this._barChart(counts, dayLabels, 'var(--success)');
  },

  _renderBudgetChart() {
    const container = document.getElementById('chart-budget');
    if (!container) return;

    const cats = BudgetManager.calcByCategory();
    if (cats.length === 0) {
      container.innerHTML = `<div style="color:var(--text-3);font-size:13px;padding:20px 0;">Aucune dépense.</div>`;
      return;
    }

    const values = cats.map(c => c.pct);
    const labels = cats.map(c => c.name.substring(0, 8));
    const colors = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--text-2)'];

    container.innerHTML = this._barChart(values, labels, null, colors);
  },

  /**
   * Génère un graphe à barres SVG simple
   */
  _barChart(values, labels, color = 'var(--accent)', colors = null) {
    const max    = Math.max(...values, 1);
    const w      = 260;
    const h      = 120;
    const n      = values.length;
    const barW   = Math.floor((w - (n - 1) * 4) / n);
    const padBot = 20;

    const bars = values.map((v, i) => {
      const barH  = Math.round((v / max) * (h - padBot));
      const x     = i * (barW + 4);
      const y     = h - padBot - barH;
      const c     = colors ? colors[i % colors.length] : color;
      return `
        <rect class="chart-bar" x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${c}" rx="3"
          opacity="0.85">
          <title>${labels[i]}: ${v}</title>
        </rect>
        <text x="${x + barW/2}" y="${h - 2}" text-anchor="middle"
          font-size="9" fill="var(--text-3)">${labels[i]}</text>
        ${v > 0 ? `<text x="${x + barW/2}" y="${y - 3}" text-anchor="middle" font-size="10" fill="var(--text-2)" font-weight="600">${v}</text>` : ''}
      `;
    }).join('');

    return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg" style="width:100%;height:${h}px;">${bars}</svg>`;
  },

  init() {}
};

/* ============================================================
   UTILITAIRES GLOBAUX
   ============================================================ */

/** Génère un identifiant unique */
function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Échappe le HTML pour éviter les XSS */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Formate une date ISO en français */
function formatDate(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return isoDate; }
}

/** Formate une date+heure ISO */
function formatDateFull(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return isoDate; }
}

/** Ferme un modal par son id */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

/** Demande confirmation avant d'exécuter une action */
function confirmAction(message, onConfirm) {
  if (window.confirm(message)) onConfirm();
}

/* ============================================================
   GESTIONNAIRE D'ÉVÉNEMENTS GLOBAL (Event Delegation)
   ============================================================ */
function initEventDelegation() {

  // ===== NAVIGATION =====
  // (géré dans Router.init())

  // ===== FERMETURE MODALES =====
  document.addEventListener('click', e => {
    // Bouton fermeture modal (data-close)
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      closeModal(closeBtn.dataset.close);
      return;
    }

    // Clic overlay
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
      return;
    }
  });

  // ===== RACCOURCI ESC =====
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });

  // ===== BOUTON QUICK ADD (TOPBAR) =====
  const btnQuickAdd = document.getElementById('btn-quick-add');
  if (btnQuickAdd) {
    btnQuickAdd.addEventListener('click', () => TaskManager.openModal());
  }

  // ===== VUE TÂCHES =====
  const btnAddTask = document.getElementById('btn-add-task');
  if (btnAddTask) {
    btnAddTask.addEventListener('click', () => TaskManager.openModal());
  }

  const btnSaveTask = document.getElementById('btn-save-task');
  if (btnSaveTask) {
    btnSaveTask.addEventListener('click', () => TaskManager.saveFromModal());
  }

  // Filtres tâches
  document.addEventListener('click', e => {
    const tab = e.target.closest('#task-filters .filter-tab');
    if (tab) {
      document.querySelectorAll('#task-filters .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      TaskManager.currentFilter = tab.dataset.filter;
      TaskManager.renderList();
    }
  });

  // Actions sur les tâches (toggle, edit, delete)
  document.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const id = e.target.closest('[data-action]').dataset.id;

    switch (action) {
      case 'toggle-task': {
        const task = TaskManager.getAll().find(t => t.id === id);
        if (task) {
          const newStatus = task.status === 'done' ? 'pending' : 'done';
          TaskManager.update(id, {
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : null
          });
          // Mise à jour DOM ciblée au lieu de tout re-rendre
          const itemEl = document.querySelector(`[data-task-id="${id}"]`);
          if (itemEl) {
            const checkEl = itemEl.querySelector('.task-check');
            itemEl.classList.toggle('done', newStatus === 'done');
            checkEl?.classList.toggle('checked', newStatus === 'done');
          } else {
            TaskManager.renderList(); // fallback
          }
          Dashboard.refreshWidgets();
        }
        break;
      }

      case 'edit-task':
        TaskManager.openModal(id);
        break;

      case 'delete-task':
        confirmAction('Supprimer cette tâche ?', () => {
          TaskManager.delete(id);
          TaskManager.renderList();
          Dashboard.refreshWidgets();
          Toast.show('Tâche supprimée.', 'info');
        });
        break;

      case 'mark-habit':
        HabitTracker.markToday(id);
        HabitTracker.renderList();
        Dashboard.refreshWidgets();
        Toast.show('Habitude validée ! 🔥', 'success');
        break;

      case 'delete-habit':
        confirmAction('Supprimer cette habitude ?', () => {
          HabitTracker.delete(id);
          HabitTracker.renderList();
          Dashboard.refreshWidgets();
          Toast.show('Habitude supprimée.', 'info');
        });
        break;

      case 'toggle-sub': {
        const index = parseInt(e.target.closest('[data-index]')?.dataset.index ??
                               e.target.closest('[data-action]').dataset.index);
        GoalManager.toggleSub(index);
        GoalManager.render();
        Dashboard.refreshWidgets();
        break;
      }

      case 'delete-tx':
        confirmAction('Supprimer cette transaction ?', () => {
          BudgetManager.delete(id);
          BudgetManager.render();
          Dashboard.refreshWidgets();
          Toast.show('Transaction supprimée.', 'info');
        });
        break;

      case 'remove-sub':
        GoalManager.removeSubInput(parseInt(e.target.closest('[data-action]').dataset.index));
        break;
    }
  });

  // ===== VUE HABITUDES =====
  const btnAddHabit = document.getElementById('btn-add-habit');
  if (btnAddHabit) btnAddHabit.addEventListener('click', () => HabitTracker.openModal());

  const btnSaveHabit = document.getElementById('btn-save-habit');
  if (btnSaveHabit) btnSaveHabit.addEventListener('click', () => HabitTracker.saveFromModal());

  // ===== VUE OBJECTIFS =====
  const btnEditGoal = document.getElementById('btn-edit-goal');
  if (btnEditGoal) btnEditGoal.addEventListener('click', () => GoalManager.openModal());

  const btnSaveGoal = document.getElementById('btn-save-goal');
  if (btnSaveGoal) btnSaveGoal.addEventListener('click', () => GoalManager.saveFromModal());

  const btnAddSub = document.getElementById('btn-add-sub');
  if (btnAddSub) btnAddSub.addEventListener('click', () => GoalManager.addSubInput());

  // Bouton "Créer mon objectif" (empty state)
  document.addEventListener('click', e => {
    if (e.target.id === 'btn-create-goal') {
      GoalManager.openModal();
    }
  });

  // ===== VUE BUDGET =====
  const btnAddTx = document.getElementById('btn-add-transaction');
  if (btnAddTx) btnAddTx.addEventListener('click', () => BudgetManager.openModal());

  const btnSaveTx = document.getElementById('btn-save-transaction');
  if (btnSaveTx) btnSaveTx.addEventListener('click', () => BudgetManager.saveFromModal());

  // ===== STATS =====
  const btnRefreshStats = document.getElementById('btn-refresh-stats');
  if (btnRefreshStats) btnRefreshStats.addEventListener('click', () => {
    StatsEngine.render();
    Toast.show('Statistiques actualisées.', 'info');
  });

  // ===== ENTRÉE CLAVIER sur les inputs principaux =====
  document.getElementById('task-input-title')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') TaskManager.saveFromModal();
  });
  document.getElementById('habit-input-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') HabitTracker.saveFromModal();
  });
  document.getElementById('tx-input-label')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') BudgetManager.saveFromModal();
  });
  document.getElementById('tx-input-amount')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') BudgetManager.saveFromModal();
  });
}

/* ============================================================
   INITIALISATION GÉNÉRALE
   ============================================================ */
function initApp() {
  // 1. Modules de base
  StorageManager.init();
  Toast.init();
  MotivationEngine.init();

  // 2. Modules fonctionnels
  TaskManager.init();
  HabitTracker.init();
  GoalManager.init();
  BudgetManager.init();
  StatsEngine.init();
  Dashboard.init();

  // 3. Événements globaux
  initEventDelegation();

  // 4. Router (déclenche le premier rendu)
  Router.init();

  console.log('[SmartLife Pro] Application démarrée avec succès ✓');
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

/* ===== NAV DRAWER (mobile) ===== */
(function () {
  const drawer  = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-drawer-overlay');
  const btnOpen = document.getElementById('btn-menu-toggle');
  const btnClose = document.getElementById('btn-drawer-close');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btnOpen.addEventListener('click', openDrawer);
  btnClose.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Fermer automatiquement quand on choisit une section
  drawer.querySelectorAll('.nav-item[data-nav]').forEach(item => {
    item.addEventListener('click', closeDrawer);
  });
})();
