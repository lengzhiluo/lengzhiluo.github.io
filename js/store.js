/* ============================================================
 * store.js — 业务逻辑与本地持久化（纯前端演示版）
 * 后续接真实后端时，把这里的方法改成 fetch 调用即可，
 * 页面层（app.js）无需改动。
 * ============================================================ */
window.Store = (function () {
  var KEY = 'itpool_state_v2';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function now() { return Date.now(); }

  function fresh() {
    return {
      version: SEED.version,
      users: clone(SEED.users),
      tickets: clone(SEED.tickets),
      ledger: clone(SEED.ledger),
      notifications: clone(SEED.notifications),
      config: clone(SEED.config),
      shift: clone(SEED.shift),
      currentUserId: SEED.currentUserId
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.version === SEED.version) return d;
      }
    } catch (e) {}
    return fresh();
  }

  var state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function uid(prefix) {
    return prefix + String(now()).slice(-7);
  }

  /* ---------- 用户 ---------- */
  function getUsers() { return state.users; }
  function getUserById(id) { return state.users.filter(function (u) { return u.id === id; })[0] || null; }
  function getCurrentUser() { return getUserById(state.currentUserId); }
  function setCurrentUser(id) { if (getUserById(id)) { state.currentUserId = id; save(); } }
  function isIT(user) {
    if (!user) return false;
    return user.role === 'it' || user.role === 'admin';
  }
  function isAdmin(user) { return !!user && user.role === 'admin'; }

  /* ---------- 配置 ---------- */
  function getConfig() { return state.config; }
  function getShift() { return state.shift; }
  function updateConfig(patch) {
    Object.keys(patch).forEach(function (k) { state.config[k] = patch[k]; });
    save();
  }
  function updateShift(patch) {
    Object.keys(patch).forEach(function (k) { state.shift[k] = patch[k]; });
    save();
  }

  /* ---------- 工单 ---------- */
  function getTickets() { return state.tickets.slice(); }
  function getTicket(id) {
    return state.tickets.filter(function (t) { return t.id === id; })[0] || null;
  }

  function getPool() {
    return state.tickets.filter(function (t) { return t.status === 'pending'; });
  }

  function getMyTasks(userId) {
    return state.tickets.filter(function (t) {
      return t.assigneeId === userId && (t.status === 'claimed' || t.status === 'in_progress' || t.status === 'resolved');
    });
  }

  function getMyReports(userId) {
    return state.tickets.filter(function (t) { return t.reporterId === userId; });
  }

  function pushEvent(ticket, text, by) {
    ticket.events.push({ time: now(), text: text, by: by });
  }

  function pushNotification(type, title, body, ticketId) {
    state.notifications.unshift({
      id: uid('N'), type: type, title: title, body: body,
      ticketId: ticketId || '', createdAt: now(), read: false
    });
  }

  /* 员工报障 */
  function createTicket(input) {
    var user = getCurrentUser();
    var ticket = {
      id: uid('T'),
      title: input.title,
      category: input.category,
      desc: input.desc,
      urgency: input.urgency || 'normal',
      reporterId: user.id,
      reporterName: user.name,
      station: input.station || user.station || '',
      status: 'pending',
      assigneeId: null,
      assigneeName: null,
      createdAt: now(),
      claimedAt: null,
      closedAt: null,
      rootCause: '',
      conclusion: '',
      isSelfCreated: false,
      affectedCount: input.affectedCount || 1,
      events: []
    };
    pushEvent(ticket, user.name + ' 提交报障', user.name);
    state.tickets.unshift(ticket);
    pushNotification('new', '新工单待认领', ticket.id + ' ' + ticket.title + '（' + (ticket.urgency === 'urgent' ? '紧急' : '普通') + '），来自 ' + user.name + ' ' + ticket.station, ticket.id);
    save();
    return ticket;
  }

  /* IT 自创单：创建即承接 */
  function createSelfTicket(input) {
    var user = getCurrentUser();
    var ticket = {
      id: uid('T'),
      title: input.title,
      category: input.category,
      desc: input.desc,
      urgency: 'normal',
      reporterId: user.id,
      reporterName: user.name,
      station: user.station || '机房',
      status: 'in_progress',
      assigneeId: user.id,
      assigneeName: user.name,
      createdAt: now(),
      claimedAt: now(),
      closedAt: null,
      rootCause: '',
      conclusion: '',
      isSelfCreated: true,
      affectedCount: input.affectedCount || 0,
      events: []
    };
    pushEvent(ticket, user.name + ' 创建自创单并承接', user.name);
    state.tickets.unshift(ticket);
    save();
    return ticket;
  }

  function claimTicket(id) {
    var user = getCurrentUser();
    var t = getTicket(id);
    if (!t || t.status !== 'pending') return null;
    t.status = 'claimed';
    t.assigneeId = user.id;
    t.assigneeName = user.name;
    t.claimedAt = now();
    pushEvent(t, user.name + ' 认领工单', user.name);
    save();
    return t;
  }

  function startProgress(id) {
    var user = getCurrentUser();
    var t = getTicket(id);
    if (!t || (t.status !== 'claimed' && t.status !== 'in_progress')) return null;
    t.status = 'in_progress';
    pushEvent(t, '状态更新为「处理中」', user.name);
    save();
    return t;
  }

  /* 提交结论：进入待确认 */
  function submitConclusion(id, rootCause, conclusion) {
    var user = getCurrentUser();
    var t = getTicket(id);
    if (!t) return null;
    t.rootCause = rootCause || '';
    t.conclusion = conclusion || '';
    t.status = 'resolved';
    pushEvent(t, user.name + ' 提交处理结论，等待确认', user.name);
    save();
    return t;
  }

  /* 计算一张单的得分 */
  function calcPoints(ticket, user) {
    var cfg = state.config;
    var base = ticket.urgency === 'urgent' ? cfg.urgentPoints : cfg.normalPoints;
    if (ticket.isSelfCreated) base = cfg.selfPoints;
    var isNight = state.shift.nightShiftUserId === user.id;
    if (isNight) base = Math.round(base * cfg.nightMultiplier * 10) / 10;
    return base;
  }

  /* 确认闭环：加分 + 生成流水 */
  function confirmClose(id) {
    var t = getTicket(id);
    if (!t || t.status !== 'resolved') return null;
    var user = getUserById(t.assigneeId) || getCurrentUser();
    t.status = 'closed';
    t.closedAt = now();
    var pts = calcPoints(t, user);
    var type = t.isSelfCreated ? 'self' : (t.urgency === 'urgent' ? 'urgent' : 'normal');
    if (state.shift.nightShiftUserId === user.id) type = 'night';
    state.ledger.push({
      id: uid('L'), userId: user.id, userName: user.name, ticketId: t.id,
      type: type, points: pts, season: 2026, createdAt: now(),
      note: t.isSelfCreated ? '自创单闭环' : '工单闭环'
    });
    pushEvent(t, '工单闭环，' + user.name + ' +' + pts + ' 分', '系统');
    pushNotification('point', '工单闭环，积分到账', t.id + ' ' + t.title + '，' + user.name + ' +' + pts + ' 分', t.id);
    save();
    return { ticket: t, points: pts };
  }

  /* 自助闭环（演示用：提交结论后直接确认） */
  function submitAndClose(id, rootCause, conclusion) {
    var t = submitConclusion(id, rootCause, conclusion);
    if (!t) return null;
    return confirmClose(id);
  }

  /* ---------- 统计 ---------- */
  function getStats(userId) {
    var closed = state.tickets.filter(function (t) {
      return t.assigneeId === userId && t.status === 'closed';
    });
    var cat = {};
    closed.forEach(function (t) {
      var key = t.isSelfCreated ? '自创' : t.category;
      cat[key] = (cat[key] || 0) + 1;
    });
    var led = state.ledger.filter(function (l) { return l.userId === userId; });
    var totalPoints = led.reduce(function (s, l) { return s + Number(l.points); }, 0);
    var seasonPoints = led.filter(function (l) { return l.season === 2026; })
      .reduce(function (s, l) { return s + Number(l.points); }, 0);
    var nightCount = led.filter(function (l) { return l.type === 'night' || l.type === 'duty'; }).length;
    var knowledgeCount = led.filter(function (l) { return l.type === 'knowledge'; }).length;
    return {
      closedCount: closed.length,
      cat: cat,
      totalPoints: Math.round(totalPoints * 10) / 10,
      seasonPoints: Math.round(seasonPoints * 10) / 10,
      nightCount: nightCount,
      knowledgeCount: knowledgeCount,
      monthZeroMiss: true
    };
  }

  function getAchievements(userId) {
    var s = getStats(userId);
    return SEED.achievements.map(function (a) {
      var unlocked = false;
      try { unlocked = !!a.check(s); } catch (e) {}
      return {
        code: a.code, name: a.name, icon: a.icon, type: a.type,
        desc: a.desc, unlocked: unlocked
      };
    });
  }

  function getSeasonInfo(userId) {
    var cfg = state.config;
    var s = getStats(userId);
    var pts = s.seasonPoints;
    var levels = cfg.seasonLevels;
    var names = cfg.seasonLevelNames;
    var idx = -1;
    for (var i = 0; i < levels.length; i++) { if (pts >= levels[i]) idx = i; }
    var curName = idx >= 0 ? names[idx] : '新手';
    var nextTarget = idx + 1 < levels.length ? levels[idx + 1] : levels[levels.length - 1];
    var prevTarget = idx >= 0 ? levels[idx] : 0;
    var pct = nextTarget > prevTarget ? Math.min(100, Math.round((pts - prevTarget) / (nextTarget - prevTarget) * 100)) : 100;
    if (idx === levels.length - 1) pct = 100;
    return {
      points: pts, levelName: curName, nextTarget: nextTarget,
      prevTarget: prevTarget, pct: pct, isMax: idx === levels.length - 1
    };
  }

  function getTeamStats() {
    var members = state.users.filter(function (u) { return u.role === 'it' || u.role === 'admin'; })
      .map(function (u) {
        var s = getStats(u.id);
        return { user: u, points: s.totalPoints, closedCount: s.closedCount };
      });
    var totalPoints = members.reduce(function (a, m) { return a + m.points; }, 0);
    var closedThisMonth = state.tickets.filter(function (t) {
      if (t.status !== 'closed' || !t.closedAt) return false;
      var d = new Date(t.closedAt);
      var n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    }).length;
    return {
      members: members,
      totalPoints: Math.round(totalPoints * 10) / 10,
      closedThisMonth: closedThisMonth,
      zeroMiss: true
    };
  }

  /* ---------- 积分明细 ---------- */
  function getLedger(userId, limit) {
    return state.ledger.filter(function (l) { return l.userId === userId; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; })
      .slice(0, limit || 10);
  }

  /* ---------- 通知 ---------- */
  function getNotifications() { return state.notifications.slice(); }
  function getUnreadCount() { return state.notifications.filter(function (n) { return !n.read; }).length; }
  function markRead(id) {
    state.notifications.forEach(function (n) { if (n.id === id) n.read = true; });
    save();
  }
  function markAllRead() {
    state.notifications.forEach(function (n) { n.read = true; });
    save();
  }

  /* ---------- 重置（用于演示） ---------- */
  function reset() {
    state = fresh();
    save();
  }

  return {
    getUsers: getUsers, getUserById: getUserById, getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser, isIT: isIT, isAdmin: isAdmin,
    getConfig: getConfig, updateConfig: updateConfig,
    getShift: getShift, updateShift: updateShift,
    getTickets: getTickets, getTicket: getTicket, getPool: getPool,
    getMyTasks: getMyTasks, getMyReports: getMyReports,
    createTicket: createTicket, createSelfTicket: createSelfTicket,
    claimTicket: claimTicket, startProgress: startProgress,
    submitConclusion: submitConclusion, confirmClose: confirmClose,
    submitAndClose: submitAndClose, calcPoints: calcPoints,
    getStats: getStats, getAchievements: getAchievements, getSeasonInfo: getSeasonInfo,
    getTeamStats: getTeamStats,
    getLedger: getLedger,
    getNotifications: getNotifications, getUnreadCount: getUnreadCount,
    markRead: markRead, markAllRead: markAllRead, reset: reset
  };
})();
