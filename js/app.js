/* ============================================================
 * app.js — 路由、布局与页面渲染（纯前端演示版）
 * 使用 hash 路由，零构建，可直接在 GitHub Pages / 本地文件打开。
 * ============================================================ */
(function () {
  'use strict';

  var STATUS = { pending: '待认领', claimed: '已认领', in_progress: '处理中', resolved: '待确认', closed: '已闭环' };
  var STATUS_CLASS = { pending: 'pending', claimed: 'claimed', in_progress: 'in_progress', resolved: 'resolved', closed: 'closed' };

  var ui = { poolFilter: 'all', reportMode: 'employee' };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function timeAgo(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' 小时前';
    var dd = Math.floor(h / 24);
    if (dd < 30) return dd + ' 天前';
    return fmtDate(ts);
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
  function statusTag(st) {
    return '<span class="tag ' + STATUS_CLASS[st] + '">' + STATUS[st] + '</span>';
  }
  function urgencyTag(u) {
    return u === 'urgent' ? '<span class="tag urgent">紧急</span>' : '<span class="tag normal">普通</span>';
  }
  function initials(name) { return name ? name.slice(-1) : '?'; }

  /* ---------- 路由 ---------- */
  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    if (!h) return { name: 'pool' };
    var parts = h.split('/');
    if (parts[0] === 'ticket' && parts[1]) return { name: 'ticket', id: parts[1] };
    return { name: parts[0] };
  }

  /* ---------- 布局 ---------- */
  var TOP_ITEMS = [
    { key: 'report', label: '报障', href: '#/report' },
    { key: 'pool', label: '任务池', href: '#/pool' },
    { key: 'tasks', label: '我的任务', href: '#/tasks' },
    { key: 'team', label: '团队', href: '#/team' },
    { key: 'profile', label: '我的', href: '#/profile' }
  ];
  var BOTTOM_ITEMS = [
    { key: 'report', label: '报障', href: '#/report', icon: '📝' },
    { key: 'pool', label: '任务池', href: '#/pool', icon: '📋' },
    { key: 'tasks', label: '我的任务', href: '#/tasks', icon: '✅' },
    { key: 'team', label: '团队', href: '#/team', icon: '🏆' },
    { key: 'profile', label: '我的', href: '#/profile', icon: '👤' }
  ];

  function userOptions() {
    var cur = Store.getCurrentUser();
    return Store.getUsers().map(function (u) {
      return '<option value="' + u.id + '"' + (cur && cur.id === u.id ? ' selected' : '') + '>' +
        esc(u.name) + '（' + (u.role === 'admin' ? '主管' : u.role === 'it' ? 'IT' : '员工') + '）</option>';
    }).join('');
  }

  function layout(active, content) {
    var unread = Store.getUnreadCount();
    var cur = Store.getCurrentUser();
    var isAdmin = Store.isAdmin(cur);

    var topNav = TOP_ITEMS.map(function (it) {
      return '<a href="' + it.href + '" class="' + (it.key === active ? 'active' : '') + '">' + it.label + '</a>';
    }).join('') + (isAdmin ? '<a href="#/admin" class="' + (active === 'admin' ? 'active' : '') + '">管理</a>' : '');

    var bottomNav = BOTTOM_ITEMS.map(function (it) {
      return '<a href="' + it.href + '" class="' + (it.key === active ? 'active' : '') + '">' +
        '<span class="bi">' + it.icon + '</span>' + it.label + '</a>';
    }).join('');

    return '<header class="topbar">' +
        '<a href="#/pool" class="brand"><span class="logo">🛠️</span><span class="brand-text">IT 运维任务池</span></a>' +
        '<nav class="top-nav">' + topNav + '</nav>' +
        '<div class="top-actions">' +
          '<a href="#/messages" class="icon-btn" aria-label="消息中心">🔔' +
            (unread > 0 ? '<span class="bell-dot">' + (unread > 99 ? '99+' : unread) + '</span>' : '') +
          '</a>' +
          '<select class="user-switch" id="user-switch" aria-label="切换演示身份">' + userOptions() + '</select>' +
        '</div>' +
      '</header>' +
      '<main class="content">' + content + '</main>' +
      '<nav class="bottom-nav">' + bottomNav + '</nav>';
  }

  function pageHead(title, sub) {
    return '<div class="page-head"><h1 class="page-title">' + title + '</h1>' +
      (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</div>';
  }

  function emptyState(icon, text) {
    return '<div class="empty"><span class="ei">' + icon + '</span><p>' + text + '</p></div>';
  }

  /* ---------- 工单卡片 ---------- */
  function ticketCard(t, opts) {
    opts = opts || {};
    var meta = '<b>' + esc(t.reporterName) + '</b> · ' + esc(t.station || '未填') + ' · ' + timeAgo(t.createdAt);
    var btn = '';
    if (opts.claimable) {
      btn = '<button class="btn btn-primary btn-sm" data-action="claim" data-id="' + t.id + '">认领</button>';
    } else if (opts.view) {
      btn = '<a class="btn btn-ghost btn-sm" href="#/ticket/' + t.id + '">查看</a>';
    }
    return '<div class="ticket-card">' +
        '<div class="ticket-head">' + urgencyTag(t.urgency) + statusTag(t.status) +
          (t.isSelfCreated ? '<span class="tag self">自创</span>' : '') +
          '<span class="tag cat">' + esc(t.category) + '</span></div>' +
        '<h3 class="ticket-title"><a href="#/ticket/' + t.id + '">' + esc(t.title) + '</a></h3>' +
        '<div class="ticket-meta">' + meta + '</div>' +
        (btn ? '<div class="ticket-foot">' + (t.affectedCount > 1 ? '<span class="tag">影响 ' + t.affectedCount + ' 人</span>' : '') +
          '<span class="time">' + (t.assigneeName ? '接单人 ' + esc(t.assigneeName) : '暂无人认领') + '</span>' + btn + '</div>' : '') +
      '</div>';
  }

  /* ---------- 登录 / 身份选择 ---------- */
  function viewLogin() {
    var cards = Store.getUsers().map(function (u) {
      var role = u.role === 'admin' ? '主管' : u.role === 'it' ? 'IT 运维' : '普通员工';
      return '<button class="ticket-card" style="text-align:left;width:100%" data-action="login-as" data-id="' + u.id + '">' +
          '<div class="ticket-head"><span class="tag ' + (u.role === 'employee' ? 'normal' : 'claimed') + '">' + role + '</span>' +
          '<span class="tag cat">' + esc(u.dept) + '</span></div>' +
          '<h3 class="ticket-title">' + esc(u.name) + '</h3>' +
          '<div class="ticket-meta">工位 ' + esc(u.station) + '</div>' +
        '</button>';
    }).join('');

    return '<div style="max-width:560px;margin:0 auto;padding:32px 18px 60px">' +
        '<div style="text-align:center;margin-bottom:24px">' +
          '<div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#2f6fed,#7a5af5);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 12px">🛠️</div>' +
          '<h1 style="font-size:22px;margin:0 0 6px">IT 运维任务池</h1>' +
          '<p style="color:#98a0ad;font-size:13.5px;margin:0">演示版 · 选择一个身份进入</p>' +
        '</div>' +
        '<div class="ticket-list">' + cards + '</div>' +
        '<p style="text-align:center;color:#98a0ad;font-size:12.5px;margin-top:22px">这是纯前端演示，数据保存在本地浏览器，可随时在「管理」里重置。</p>' +
      '</div>';
  }

  /* ---------- 报障 / 自创单 ---------- */
  function viewReport(user) {
    var it = Store.isIT(user);
    var modeTabs = it ? '<div class="filter-row">' +
        '<button class="chip ' + (ui.reportMode === 'employee' ? 'active' : '') + '" data-action="report-mode" data-mode="employee">员工报障</button>' +
        '<button class="chip ' + (ui.reportMode === 'self' ? 'active' : '') + '" data-action="report-mode" data-mode="self">IT 自创单</button>' +
      '</div>' : '';

    if (it && ui.reportMode === 'self') {
      return pageHead('新建自创单', '巡检、机房维护、批量升级、口头报障补录——创建即承接，填结论直接闭环') +
        modeTabs +
        '<div class="card"><form id="self-form">' +
          '<div class="form-item"><label class="label">任务标题<span class="req">*</span></label>' +
            '<input class="input" name="title" placeholder="例如：机房 UPS 与温湿度巡检" required></div>' +
          '<div class="form-item"><label class="label">分类</label>' +
            '<select class="select" name="category">' + categoryOptions() + '</select></div>' +
          '<div class="form-item"><label class="label">工作内容</label>' +
            '<textarea class="textarea" name="desc" placeholder="简述做了什么、结果如何"></textarea></div>' +
          '<div class="form-item"><label class="label">影响人数（可选）</label>' +
            '<input class="input" name="affectedCount" type="number" min="0" placeholder="0"></div>' +
          '<button class="btn btn-primary btn-block" type="submit">创建并承接</button>' +
        '</form></div>';
    }

    var recent = Store.getMyReports(user.id).slice(0, 6);
    var recentHtml = recent.length
      ? '<div class="card"><h3 class="card-title">我最近的报障</h3><div class="ticket-list">' +
          recent.map(function (t) { return ticketCard(t, { view: true }); }).join('') + '</div></div>'
      : '';

    return pageHead('我要报障', '描述你遇到的问题，IT 会尽快接单处理；紧急故障请同时电话联系值班 IT') +
      modeTabs +
      '<div class="card"><form id="report-form">' +
        '<div class="form-item"><label class="label">问题标题<span class="req">*</span></label>' +
          '<input class="input" name="title" placeholder="例如：电脑开机蓝屏、无法连接内网" required></div>' +
        '<div class="form-item"><label class="label">问题分类</label>' +
          '<select class="select" name="category">' + categoryOptions() + '</select></div>' +
        '<div class="form-item"><label class="label">紧急程度</label>' +
          '<div class="seg">' +
            '<div class="seg-item"><input type="radio" id="u-normal" name="urgency" value="normal" checked><label for="u-normal">普通</label></div>' +
            '<div class="seg-item"><input type="radio" id="u-urgent" name="urgency" value="urgent"><label for="u-urgent">紧急</label></div>' +
          '</div></div>' +
        '<div class="form-item"><label class="label">工位 / 位置</label>' +
          '<input class="input" name="station" value="' + esc(user.station) + '" placeholder="例如 A-301"></div>' +
        '<div class="form-item"><label class="label">问题描述</label>' +
          '<textarea class="textarea" name="desc" placeholder="出现时间、现象、已尝试的操作"></textarea></div>' +
        '<button class="btn btn-primary btn-block" type="submit">提交报障</button>' +
      '</form></div>' +
      recentHtml;
  }

  function categoryOptions() {
    return SEED.categories.map(function (c) {
      return '<option value="' + c + '">' + c + '</option>';
    }).join('');
  }

  /* ---------- 任务池 ---------- */
  function viewPool(user) {
    var pool = Store.getPool();
    var filtered = pool.filter(function (t) {
      if (ui.poolFilter === 'urgent') return t.urgency === 'urgent';
      if (ui.poolFilter === 'normal') return t.urgency === 'normal';
      return true;
    }).sort(function (a, b) {
      if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1;
      return a.createdAt - b.createdAt;
    });

    var it = Store.isIT(user);
    var urgentCount = pool.filter(function (t) { return t.urgency === 'urgent'; }).length;

    var filters = '<div class="filter-row">' +
      '<button class="chip ' + (ui.poolFilter === 'all' ? 'active' : '') + '" data-action="filter" data-filter="all">全部 ' + pool.length + '</button>' +
      '<button class="chip ' + (ui.poolFilter === 'urgent' ? 'active' : '') + '" data-action="filter" data-filter="urgent">紧急 ' + urgentCount + '</button>' +
      '<button class="chip ' + (ui.poolFilter === 'normal' ? 'active' : '') + '" data-action="filter" data-filter="normal">普通</button>' +
    '</div>';

    var list = filtered.length
      ? '<div class="ticket-list">' + filtered.map(function (t) {
          return ticketCard(t, { claimable: it, view: !it });
        }).join('') + '</div>'
      : emptyState('🎉', '任务池已清空，暂时没有待认领的工单');

    return pageHead('任务池', '按紧急程度排序，谁有空谁认领；白天 15 分钟无人认领将自动落值班人') +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="k">待认领</div><div class="v">' + pool.length + '<small>单</small></div></div>' +
        '<div class="stat"><div class="k">其中紧急</div><div class="v" style="color:#d6453d">' + urgentCount + '<small>单</small></div></div>' +
      '</div>' +
      filters + list;
  }

  /* ---------- 我的任务 ---------- */
  function viewTasks(user) {
    if (!Store.isIT(user)) {
      var reports = Store.getMyReports(user.id);
      var list = reports.length
        ? '<div class="ticket-list">' + reports.map(function (t) { return ticketCard(t, { view: true }); }).join('') + '</div>'
        : emptyState('📭', '你还没有提交过报障');
      return pageHead('我的报障', '这里是你提交过的工单，可随时查看处理进度') + list;
    }

    var tasks = Store.getMyTasks(user.id);
    var doing = tasks.filter(function (t) { return t.status === 'claimed' || t.status === 'in_progress'; });
    var pendingConfirm = tasks.filter(function (t) { return t.status === 'resolved'; });

    function group(title, arr, icon) {
      if (!arr.length) return '';
      return '<div class="card"><h3 class="card-title">' + icon + ' ' + title + '（' + arr.length + '）</h3>' +
        '<div class="ticket-list">' + arr.map(function (t) {
          return '<div class="ticket-card">' +
              '<div class="ticket-head">' + statusTag(t.status) + urgencyTag(t.urgency) +
                (t.isSelfCreated ? '<span class="tag self">自创</span>' : '') +
                '<span class="tag cat">' + esc(t.category) + '</span></div>' +
              '<h3 class="ticket-title"><a href="#/ticket/' + t.id + '">' + esc(t.title) + '</a></h3>' +
              '<div class="ticket-meta"><b>' + esc(t.reporterName) + '</b> · ' + esc(t.station) + ' · ' + timeAgo(t.createdAt) + '</div>' +
              '<div class="ticket-foot">' +
                (t.status === 'claimed' ? '<button class="btn btn-primary btn-sm" data-action="start" data-id="' + t.id + '">开始处理</button>' : '') +
                (t.status === 'in_progress' ? '<a class="btn btn-primary btn-sm" href="#/ticket/' + t.id + '">填写结论</a>' : '') +
                (t.status === 'resolved' ? '<button class="btn btn-primary btn-sm" data-action="confirm-close" data-id="' + t.id + '">确认闭环</button>' : '') +
                '<a class="btn btn-ghost btn-sm" href="#/ticket/' + t.id + '">详情</a>' +
              '</div>' +
            '</div>';
        }).join('') + '</div></div>';
    }

    var content = pageHead('我的任务', '接单后记得更新状态，3 人小团队最容易犯的错是「接了忘了改」') +
      (tasks.length ? group('进行中', doing, '🔧') + group('待确认', pendingConfirm, '⏳')
        : emptyState('☕', '当前没有进行中的任务，去任务池看看'));

    return content;
  }

  /* ---------- 工单详情 ---------- */
  function viewTicket(user) {
    var t = Store.getTicket(parseHash().id);
    if (!t) return pageHead('工单不存在', '') + emptyState('🔍', '找不到这张工单，可能已被删除');

    var canClaim = t.status === 'pending' && Store.isIT(user);
    var isAssignee = t.assigneeId === user.id;
    var canStart = t.status === 'claimed' && isAssignee;
    var canConclude = (t.status === 'in_progress' || t.status === 'claimed') && isAssignee;
    var canConfirm = t.status === 'resolved' && (isAssignee || Store.isAdmin(user) || t.reporterId === user.id);

    var actions = '';
    if (canClaim) actions += '<button class="btn btn-primary btn-block" data-action="claim" data-id="' + t.id + '">认领这张工单</button>';
    if (canStart) actions += '<button class="btn btn-primary btn-block" data-action="start" data-id="' + t.id + '">开始处理</button>';
    if (canConfirm) actions += '<button class="btn btn-primary btn-block" data-action="confirm-close" data-id="' + t.id + '">确认闭环并计分</button>';

    var concludeForm = '';
    if (canConclude) {
      concludeForm = '<div class="card"><h3 class="card-title">✍️ 提交处理结论</h3>' +
        '<form id="conclusion-form" data-id="' + t.id + '">' +
          '<div class="form-item"><label class="label">根因分类</label>' +
            '<input class="input" name="rootCause" placeholder="例如：显卡接口松动、证书过期" value="' + esc(t.rootCause) + '"></div>' +
          '<div class="form-item"><label class="label">处理结论<span class="req">*</span></label>' +
            '<textarea class="textarea" name="conclusion" placeholder="做了什么、结果如何" required>' + esc(t.conclusion) + '</textarea></div>' +
          '<button class="btn btn-primary btn-block" type="submit">提交结论</button>' +
        '</form></div>';
    }

    var conclusionCard = (t.status === 'resolved' || t.status === 'closed')
      ? '<div class="card"><h3 class="card-title">📌 处理结论</h3>' +
          '<div class="kv"><span class="k">根因</span><span class="v">' + (esc(t.rootCause) || '未填写') + '</span></div>' +
          '<div class="kv"><span class="k">结论</span><span class="v">' + (esc(t.conclusion) || '未填写') + '</span></div>' +
          (t.status === 'resolved' ? '<p class="hint">等待报障人确认，48 小时后自动通过。</p>' : '') +
        '</div>'
      : '';

    var timeline = '<div class="card"><h3 class="card-title">🕘 处理时间线</h3><div class="timeline">' +
      t.events.slice().reverse().map(function (e) {
        return '<div class="tl-item"><div class="tl-time">' + fmtDate(e.time) + '</div>' +
          '<div class="tl-text">' + esc(e.text) + '</div></div>';
      }).join('') + '</div></div>';

    var info = '<div class="card">' +
      '<div class="ticket-head" style="margin-bottom:10px">' + statusTag(t.status) + urgencyTag(t.urgency) +
        (t.isSelfCreated ? '<span class="tag self">自创</span>' : '') +
        '<span class="tag cat">' + esc(t.category) + '</span></div>' +
      '<h2 style="font-size:19px;margin:0 0 12px">' + esc(t.title) + '</h2>' +
      '<div class="kv"><span class="k">工单号</span><span class="v">' + t.id + '</span></div>' +
      '<div class="kv"><span class="k">报障人</span><span class="v">' + esc(t.reporterName) + '（' + esc(t.station) + '）</span></div>' +
      '<div class="kv"><span class="k">提交时间</span><span class="v">' + fmtDate(t.createdAt) + '</span></div>' +
      '<div class="kv"><span class="k">接单人</span><span class="v">' + (esc(t.assigneeName) || '暂无人认领') + '</span></div>' +
      '<div class="kv"><span class="k">影响人数</span><span class="v">' + (t.affectedCount || 0) + ' 人</span></div>' +
      (t.desc ? '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);color:var(--ink-2);font-size:14px">' + esc(t.desc) + '</div>' : '') +
    '</div>';

    return '<a href="#/pool" style="font-size:13px;color:var(--ink-3);display:inline-block;margin-bottom:12px">← 返回</a>' +
      info +
      (actions ? '<div class="card">' + actions + '</div>' : '') +
      concludeForm + conclusionCard + timeline;
  }

  /* ---------- 我的（积分 + 成就） ---------- */
  function viewProfile(user) {
    var season = Store.getSeasonInfo(user.id);
    var stats = Store.getStats(user.id);
    var achs = Store.getAchievements(user.id);
    var unlocked = achs.filter(function (a) { return a.unlocked; }).length;
    var ledger = Store.getLedger ? Store.getLedger(user.id, 8) : [];

    var hero = '<div class="points-hero">' +
        '<div class="total">累计积分<b>' + stats.totalPoints + '</b></div>' +
        '<div class="who">' + esc(user.name) + ' · ' + esc(user.dept) + '</div>' +
        '<div class="big">' + season.points + '<small>年度积分</small></div>' +
        '<span class="lvl">' + season.levelName + ' · 赛季进度</span>' +
        '<div class="progress"><div class="progress-bar" style="width:' + season.pct + '%"></div></div>' +
        '<div class="prog-text">' + (season.isMax ? '已达最高等级，继续保持！' : '距下一等级还差 ' + Math.max(0, season.nextTarget - season.points) + ' 分') + '</div>' +
      '</div>';

    var statGrid = '<div class="stat-grid">' +
        '<div class="stat"><div class="k">累计完成</div><div class="v">' + stats.closedCount + '<small>单</small></div></div>' +
        '<div class="stat"><div class="k">已解锁成就</div><div class="v">' + unlocked + '<small>/ ' + achs.length + '</small></div></div>' +
        '<div class="stat"><div class="k">夜班 / 值守</div><div class="v">' + stats.nightCount + '<small>次</small></div></div>' +
        '<div class="stat"><div class="k">知识贡献</div><div class="v">' + stats.knowledgeCount + '<small>条</small></div></div>' +
      '</div>';

    var badges = '<div class="card"><h3 class="card-title">🏅 成就墙</h3><div class="badge-wall">' +
      achs.map(function (a) {
        return '<div class="badge ' + (a.unlocked ? 'unlocked' : 'locked') + '">' +
            '<div class="badge-icon">' + a.icon + '</div>' +
            '<div class="badge-name">' + a.name + '</div>' +
            '<div class="badge-desc">' + a.desc + '</div>' +
            (a.unlocked ? '<div class="badge-unlock">已解锁</div>' : '<div class="badge-desc" style="margin-top:4px">未解锁</div>') +
          '</div>';
      }).join('') + '</div></div>';

    var ledgerHtml = '';
    if (ledger.length) {
      ledgerHtml = '<div class="card"><h3 class="card-title">📈 最近积分</h3>' +
        ledger.map(function (l) {
          return '<div class="kv"><span class="k">' + fmtDate(l.createdAt).slice(0, 6) + '</span>' +
            '<span class="v" style="flex:1">' + esc(l.note) + '</span>' +
            '<span style="color:var(--green);font-weight:800">+' + l.points + '</span></div>';
        }).join('') + '</div>';
    }

    var adminEntry = Store.isAdmin(user)
      ? '<div class="card"><a href="#/admin" class="btn btn-ghost btn-block">进入管理后台</a></div>'
      : '';

    return pageHead('我的', '纯荣誉体系：年度积分每年除夕重置，累计积分与成就永久保留') +
      hero + statGrid + badges + ledgerHtml + adminEntry;
  }

  /* ---------- 团队 ---------- */
  function viewTeam(user) {
    var team = Store.getTeamStats();
    var achs = Store.getAchievements(user.id).filter(function (a) {
      return a.type === '团队' || a.type === '质量';
    });

    var goals = '<div class="card"><h3 class="card-title">🎯 团队共同目标</h3><div class="team-goal">' +
        goalItem('月度零漏接', team.zeroMiss ? 100 : 70, team.zeroMiss ? '已达成' : '进行中') +
        goalItem('本月闭环单量', Math.min(100, Math.round(team.closedThisMonth / 40 * 100)), team.closedThisMonth + ' / 40 单') +
        goalItem('知识库贡献', 40, '2 / 5 条') +
      '</div><p class="hint">团队目标达成后，全员解锁团队徽章。</p></div>';

    var members = '<div class="card"><h3 class="card-title">👥 成员贡献</h3><div class="rank-list">' +
      team.members.map(function (m) {
        return '<div class="rank-item">' +
            '<div class="ra">' + initials(m.user.name) + '</div>' +
            '<div class="rmain"><div class="rname">' + esc(m.user.name) +
              (m.user.role === 'admin' ? ' <span class="tag">主管</span>' : '') + '</div>' +
              '<div class="rsub">累计 ' + m.closedCount + ' 单</div></div>' +
            '<div class="rpoint">' + m.points + ' 分</div>' +
          '</div>';
      }).join('') + '</div><p class="hint">3 人小团队不做个人排行榜，这里只展示贡献，不排名次。</p></div>';

    var badges = '<div class="card"><h3 class="card-title">🏆 团队徽章</h3><div class="badge-wall">' +
      achs.map(function (a) {
        return '<div class="badge ' + (a.unlocked ? 'unlocked' : 'locked') + '">' +
            '<div class="badge-icon">' + a.icon + '</div>' +
            '<div class="badge-name">' + a.name + '</div>' +
            '<div class="badge-desc">' + a.desc + '</div>' +
          '</div>';
      }).join('') + '</div></div>';

    return pageHead('团队', '团队总分与共同目标，比个人名次更能让 3 人小队有黏性') +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="k">团队总积分</div><div class="v">' + team.totalPoints + '<small>分</small></div></div>' +
        '<div class="stat"><div class="k">本月闭环</div><div class="v">' + team.closedThisMonth + '<small>单</small></div></div>' +
        '<div class="stat"><div class="k">零漏接</div><div class="v" style="color:' + (team.zeroMiss ? '#1a9d5a' : '#d6453d') + '">' + (team.zeroMiss ? '保持中' : '已中断') + '</div></div>' +
        '<div class="stat"><div class="k">成员</div><div class="v">' + team.members.length + '<small>人</small></div></div>' +
      '</div>' + goals + members + badges;
  }

  function goalItem(name, pct, label) {
    return '<div class="goal-item"><div class="gl"><span>' + name + '</span><b>' + label + '</b></div>' +
      '<div class="progress-line"><i style="width:' + pct + '%"></i></div></div>';
  }

  /* ---------- 消息中心 ---------- */
  function viewMessages() {
    var list = Store.getNotifications();
    var html = list.length
      ? '<div class="msg-list">' + list.map(function (n) {
          var icon = n.type === 'new' ? '📥' : n.type === 'remind' ? '⏰' : n.type === 'point' ? '🎉' : '📢';
          return '<div class="msg-item ' + (n.read ? '' : 'unread') + '" data-action="mark-read" data-id="' + n.id + '" data-ticket="' + (n.ticketId || '') + '">' +
              '<div class="mi">' + icon + '</div>' +
              '<div class="mb"><div class="mt">' + esc(n.title) + '</div><div class="md">' + esc(n.body) + '</div></div>' +
              '<div class="mtime">' + timeAgo(n.createdAt) + '</div>' +
            '</div>';
        }).join('') + '</div>'
      : emptyState('📭', '暂时没有消息');

    return pageHead('消息中心', '新单、超时、闭环计分都会在这里留档') +
      (list.length ? '<div style="text-align:right;margin-bottom:12px"><button class="btn btn-ghost btn-sm" data-action="mark-all-read">全部标为已读</button></div>' : '') +
      html;
  }

  /* ---------- 管理后台 ---------- */
  function viewAdmin(user) {
    if (!Store.isAdmin(user)) {
      return pageHead('管理后台', '') + emptyState('🔒', '仅主管可访问此页面');
    }
    var cfg = Store.getConfig();
    var shift = Store.getShift();
    var itUsers = Store.getUsers().filter(function (u) { return u.role === 'it' || u.role === 'admin'; });

    function shiftOptions(selected) {
      return itUsers.map(function (u) {
        return '<option value="' + u.id + '"' + (u.id === selected ? ' selected' : '') + '>' + esc(u.name) + '</option>';
      }).join('');
    }

    return pageHead('管理后台', '规则与班次都做成可配置，跑一个月后按真实数据微调') +
      '<div class="two-col">' +
        '<div class="card"><h3 class="card-title">⚙️ 积分规则</h3>' +
          '<form id="config-form">' +
            '<div class="form-item"><label class="label">普通单分值</label><input class="input" name="normalPoints" type="number" step="0.5" value="' + cfg.normalPoints + '"></div>' +
            '<div class="form-item"><label class="label">紧急单分值</label><input class="input" name="urgentPoints" type="number" step="0.5" value="' + cfg.urgentPoints + '"></div>' +
            '<div class="form-item"><label class="label">自创单分值</label><input class="input" name="selfPoints" type="number" step="0.5" value="' + cfg.selfPoints + '"></div>' +
            '<div class="form-item"><label class="label">夜班倍率</label><input class="input" name="nightMultiplier" type="number" step="0.1" value="' + cfg.nightMultiplier + '"></div>' +
            '<div class="form-item"><label class="label">自动确认时长（小时）</label><input class="input" name="autoConfirmHours" type="number" value="' + cfg.autoConfirmHours + '"></div>' +
            '<button class="btn btn-primary btn-block" type="submit">保存规则</button>' +
          '</form>' +
        '</div>' +
        '<div>' +
          '<div class="card"><h3 class="card-title">🗓️ 本月班次声明</h3>' +
            '<form id="shift-form">' +
              '<div class="form-item"><label class="label">白班一线</label><select class="select" name="dayShiftUserId">' + shiftOptions(shift.dayShiftUserId) + '</select></div>' +
              '<div class="form-item"><label class="label">夜班一线</label><select class="select" name="nightShiftUserId">' + shiftOptions(shift.nightShiftUserId) + '</select></div>' +
              '<button class="btn btn-primary btn-block" type="submit">保存班次</button>' +
            '</form><p class="hint">系统只用它判定兜底对象与夜班倍率，不做排班算法。</p>' +
          '</div>' +
          '<div class="card"><h3 class="card-title">🧰 演示工具</h3>' +
            '<p class="hint" style="margin-top:0">重置后回到初始种子数据，方便反复演示。</p>' +
            '<button class="btn btn-ghost btn-block" data-action="reset">重置演示数据</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var route = parseHash();
    var app = document.getElementById('app');
    var user = Store.getCurrentUser();

    if (route.name === 'login') {
      app.innerHTML = viewLogin();
      return;
    }
    if (!user) { location.hash = '#/login'; return; }

    var html;
    switch (route.name) {
      case 'report': html = layout('report', viewReport(user)); break;
      case 'pool': html = layout('pool', viewPool(user)); break;
      case 'tasks': html = layout('tasks', viewTasks(user)); break;
      case 'team': html = layout('team', viewTeam(user)); break;
      case 'profile': html = layout('profile', viewProfile(user)); break;
      case 'messages': html = layout('messages', viewMessages()); break;
      case 'admin': html = layout('admin', viewAdmin(user)); break;
      case 'ticket': html = layout('tasks', viewTicket(user)); break;
      default: html = layout('pool', viewPool(user));
    }
    app.innerHTML = html;
  }

  /* ---------- 事件 ---------- */
  function onClick(e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');

    if (action === 'login-as') {
      Store.setCurrentUser(id);
      location.hash = '#/pool';
      render();
      return;
    }
    if (action === 'claim') {
      var t = Store.claimTicket(id);
      if (t) toast('认领成功，记得及时更新状态');
      render();
      return;
    }
    if (action === 'start') {
      Store.startProgress(id);
      toast('已开始处理');
      render();
      return;
    }
    if (action === 'confirm-close') {
      var r = Store.confirmClose(id);
      if (r) toast('闭环成功，+' + r.points + ' 分');
      render();
      return;
    }
    if (action === 'filter') {
      ui.poolFilter = el.getAttribute('data-filter');
      render();
      return;
    }
    if (action === 'report-mode') {
      ui.reportMode = el.getAttribute('data-mode');
      render();
      return;
    }
    if (action === 'mark-all-read') {
      Store.markAllRead();
      render();
      return;
    }
    if (action === 'mark-read') {
      var tid = el.getAttribute('data-ticket');
      Store.markRead(id);
      if (tid) { location.hash = '#/ticket/' + tid; }
      render();
      return;
    }
    if (action === 'reset') {
      if (confirm('确定重置演示数据？所有本地改动会丢失。')) {
        Store.reset();
        toast('已重置');
        location.hash = '#/pool';
        render();
      }
      return;
    }
  }

  function onSubmit(e) {
    var form = e.target;
    if (form.id === 'report-form') {
      e.preventDefault();
      var f = form.elements;
      Store.createTicket({
        title: f['title'].value.trim(),
        category: f['category'].value,
        desc: f['desc'].value.trim(),
        urgency: f['urgency'].value,
        station: f['station'].value.trim()
      });
      toast('报障已提交，IT 会尽快认领');
      location.hash = '#/pool';
      render();
      return;
    }
    if (form.id === 'self-form') {
      e.preventDefault();
      var sf = form.elements;
      var t = Store.createSelfTicket({
        title: sf['title'].value.trim(),
        category: sf['category'].value,
        desc: sf['desc'].value.trim(),
        affectedCount: parseInt(sf['affectedCount'].value, 10) || 0
      });
      toast('自创单已创建，填写结论后闭环');
      location.hash = '#/ticket/' + t.id;
      render();
      return;
    }
    if (form.id === 'conclusion-form') {
      e.preventDefault();
      var id = form.getAttribute('data-id');
      Store.submitConclusion(id, form.rootCause.value.trim(), form.conclusion.value.trim());
      toast('结论已提交，等待确认闭环');
      render();
      return;
    }
    if (form.id === 'config-form') {
      e.preventDefault();
      Store.updateConfig({
        normalPoints: parseFloat(form.normalPoints.value) || 1,
        urgentPoints: parseFloat(form.urgentPoints.value) || 2,
        selfPoints: parseFloat(form.selfPoints.value) || 1,
        nightMultiplier: parseFloat(form.nightMultiplier.value) || 1.5,
        autoConfirmHours: parseInt(form.autoConfirmHours.value, 10) || 48
      });
      toast('规则已保存');
      render();
      return;
    }
    if (form.id === 'shift-form') {
      e.preventDefault();
      Store.updateShift({
        dayShiftUserId: form.dayShiftUserId.value,
        nightShiftUserId: form.nightShiftUserId.value
      });
      toast('班次已更新');
      render();
      return;
    }
  }

  function onChange(e) {
    if (e.target.id === 'user-switch') {
      Store.setCurrentUser(e.target.value);
      toast('已切换演示身份');
      render();
    }
  }

  /* ---------- 启动 ---------- */
  function init() {
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('change', onChange);
    window.addEventListener('hashchange', function () {
      render();
      window.scrollTo(0, 0);
    });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
