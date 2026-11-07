/* ============================================================
 * data.js — 种子数据与静态定义
 * 说明：这是纯前端演示版的数据源，所有数据落在 localStorage。
 *       后续接真实后端时，只需替换 store.js 的读写实现即可。
 * ============================================================ */
window.SEED = (function () {
  var now = Date.now();
  var M = 60 * 1000, H = 60 * M, D = 24 * H;

  /* ---------- 用户 ---------- */
  var users = [
    { id: 'E1',  name: '李明', role: 'employee', dept: '技术部', station: 'A-301' },
    { id: 'E2',  name: '刘洋', role: 'employee', dept: '生产部', station: 'B-102' },
    { id: 'E3',  name: '孙倩', role: 'employee', dept: '财务部', station: 'C-205' },
    { id: 'IT1', name: '王强', role: 'it',       dept: 'IT 运维', station: '机房' },
    { id: 'IT2', name: '赵敏', role: 'it',       dept: 'IT 运维', station: '机房' },
    { id: 'IT3', name: '陈刚', role: 'admin',    dept: 'IT 运维', station: '机房' }
  ];

  var categories = ['硬件', '网络', '系统', '外设', '其他'];

  /* ---------- 工单 ---------- */
  var tickets = [
    {
      id: 'T1001', title: '台式机开机蓝屏，无法进入系统', category: '系统',
      desc: '早上开机就蓝屏，重启多次无效，急用电脑处理报表。', urgency: 'urgent',
      reporterId: 'E1', reporterName: '李明', station: 'A-301',
      status: 'pending', assigneeId: null, assigneeName: null,
      createdAt: now - 6 * M, claimedAt: null, closedAt: null,
      rootCause: '', conclusion: '', isSelfCreated: false, affectedCount: 1,
      events: [ { time: now - 6 * M, text: '李明 提交报障', by: '李明' } ]
    },
    {
      id: 'T1002', title: '无法连接公司内网 Wi-Fi', category: '网络',
      desc: '手机和笔记本都连不上办公区 Wi-Fi，提示密码错误。', urgency: 'normal',
      reporterId: 'E2', reporterName: '刘洋', station: 'B-102',
      status: 'pending', assigneeId: null, assigneeName: null,
      createdAt: now - 14 * M, claimedAt: null, closedAt: null,
      rootCause: '', conclusion: '', isSelfCreated: false, affectedCount: 3,
      events: [ { time: now - 14 * M, text: '刘洋 提交报障', by: '刘洋' } ]
    },
    {
      id: 'T1003', title: '打印机提示脱机，无法打印', category: '外设',
      desc: '财务室共享打印机显示脱机，重启打印机也没用。', urgency: 'normal',
      reporterId: 'E3', reporterName: '孙倩', station: 'C-205',
      status: 'pending', assigneeId: null, assigneeName: null,
      createdAt: now - 32 * M, claimedAt: null, closedAt: null,
      rootCause: '', conclusion: '', isSelfCreated: false, affectedCount: 2,
      events: [ { time: now - 32 * M, text: '孙倩 提交报障', by: '孙倩' } ]
    },

    {
      id: 'T1004', title: 'ERP 系统登录缓慢，转圈很久', category: '系统',
      desc: '打开 ERP 登录页要等 1 分钟以上，多人反映。', urgency: 'normal',
      reporterId: 'E1', reporterName: '李明', station: 'A-301',
      status: 'in_progress', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 1 * H - 20 * M, claimedAt: now - 1 * H, closedAt: null,
      rootCause: '', conclusion: '', isSelfCreated: false, affectedCount: 8,
      events: [
        { time: now - 1 * H - 20 * M, text: '李明 提交报障', by: '李明' },
        { time: now - 1 * H, text: '王强 认领工单', by: '王强' },
        { time: now - 50 * M, text: '状态更新为「处理中」', by: '王强' }
      ]
    },
    {
      id: 'T1005', title: '邮箱收不到外部邮件', category: '系统',
      desc: '内部邮件正常，外部客户发来的邮件收不到。', urgency: 'normal',
      reporterId: 'E2', reporterName: '刘洋', station: 'B-102',
      status: 'in_progress', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 2 * H, claimedAt: now - 1.6 * H, closedAt: null,
      rootCause: '', conclusion: '', isSelfCreated: false, affectedCount: 1,
      events: [
        { time: now - 2 * H, text: '刘洋 提交报障', by: '刘洋' },
        { time: now - 1.6 * H, text: '王强 认领工单', by: '王强' },
        { time: now - 1.2 * H, text: '状态更新为「处理中」', by: '王强' }
      ]
    },
    {
      id: 'T1006', title: '显示器黑屏无信号', category: '硬件',
      desc: '主机在转但显示器一直黑屏，换线也没用。', urgency: 'urgent',
      reporterId: 'E3', reporterName: '孙倩', station: 'C-205',
      status: 'resolved', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 3 * H, claimedAt: now - 2.8 * H, closedAt: null,
      rootCause: '显卡接口松动', conclusion: '重新插拔显卡并更换 DP 线，已恢复正常显示。',
      isSelfCreated: false, affectedCount: 1,
      events: [
        { time: now - 3 * H, text: '孙倩 提交报障', by: '孙倩' },
        { time: now - 2.8 * H, text: '王强 认领工单', by: '王强' },
        { time: now - 1.5 * H, text: '王强 提交处理结论，等待报障人确认', by: '王强' }
      ]
    },

    {
      id: 'T1007', title: '键盘部分按键失灵', category: '硬件',
      desc: '数字小键盘和部分字母键没反应。', urgency: 'normal',
      reporterId: 'E1', reporterName: '李明', station: 'A-301',
      status: 'closed', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 1 * D, claimedAt: now - 1 * D + 10 * M, closedAt: now - 1 * D + 2 * H,
      rootCause: '键盘老化', conclusion: '更换备用键盘，原键盘报废登记。',
      isSelfCreated: false, affectedCount: 1,
      events: [
        { time: now - 1 * D, text: '李明 提交报障', by: '李明' },
        { time: now - 1 * D + 10 * M, text: '王强 认领工单', by: '王强' },
        { time: now - 1 * D + 2 * H, text: '工单闭环，王强 +1 分', by: '系统' }
      ]
    },
    {
      id: 'T1008', title: 'VPN 客户端连接失败', category: '网络',
      desc: '在家办公连不上公司 VPN，提示超时。', urgency: 'normal',
      reporterId: 'E2', reporterName: '刘洋', station: 'B-102',
      status: 'closed', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 2 * D, claimedAt: now - 2 * D + 8 * M, closedAt: now - 2 * D + 1 * H,
      rootCause: 'VPN 证书过期', conclusion: '更新客户端证书并重新下发配置，连接正常。',
      isSelfCreated: false, affectedCount: 1,
      events: [
        { time: now - 2 * D, text: '刘洋 提交报障', by: '刘洋' },
        { time: now - 2 * D + 8 * M, text: '王强 认领工单', by: '王强' },
        { time: now - 2 * D + 1 * H, text: '工单闭环，王强 +1 分', by: '系统' }
      ]
    },
    {
      id: 'T1009', title: '电脑疑似中病毒，频繁弹窗', category: '系统',
      desc: '桌面不断弹出广告窗口，浏览器主页被改。', urgency: 'urgent',
      reporterId: 'E3', reporterName: '孙倩', station: 'C-205',
      status: 'closed', assigneeId: 'IT2', assigneeName: '赵敏',
      createdAt: now - 3 * D, claimedAt: now - 3 * D + 5 * M, closedAt: now - 3 * D + 3 * H,
      rootCause: '恶意插件', conclusion: '清理恶意插件与启动项，全盘查杀，恢复正常。',
      isSelfCreated: false, affectedCount: 1,
      events: [
        { time: now - 3 * D, text: '孙倩 提交报障', by: '孙倩' },
        { time: now - 3 * D + 5 * M, text: '赵敏 认领工单', by: '赵敏' },
        { time: now - 3 * D + 3 * H, text: '工单闭环，赵敏 +2 分', by: '系统' }
      ]
    },

    {
      id: 'T1010', title: '机房 UPS 与温湿度巡检', category: '其他',
      desc: '例行巡检：UPS 负载、电池状态、机房温湿度记录。', urgency: 'normal',
      reporterId: 'IT1', reporterName: '王强', station: '机房',
      status: 'closed', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 4 * D, claimedAt: now - 4 * D, closedAt: now - 4 * D + 40 * M,
      rootCause: '', conclusion: 'UPS 负载 42%，温度 24℃，湿度 51%，均在正常范围。',
      isSelfCreated: true, affectedCount: 0,
      events: [
        { time: now - 4 * D, text: '王强 创建自创单并承接', by: '王强' },
        { time: now - 4 * D + 40 * M, text: '王强 提交结论，工单闭环 +1 分', by: '系统' }
      ]
    },
    {
      id: 'T1011', title: '办公区系统补丁批量升级', category: '系统',
      desc: '对办公区 30 台电脑批量推送本月安全补丁。', urgency: 'normal',
      reporterId: 'IT1', reporterName: '王强', station: '机房',
      status: 'closed', assigneeId: 'IT1', assigneeName: '王强',
      createdAt: now - 6 * D, claimedAt: now - 6 * D, closedAt: now - 6 * D + 2 * H,
      rootCause: '', conclusion: '30 台全部升级成功，2 台需重启后确认，已登记。',
      isSelfCreated: true, affectedCount: 30,
      events: [
        { time: now - 6 * D, text: '王强 创建自创单并承接', by: '王强' },
        { time: now - 6 * D + 2 * H, text: '王强 提交结论，工单闭环 +1 分', by: '系统' }
      ]
    }
  ];

  /* ---------- 积分流水（只追加） ---------- */
  var ledger = [];
  function addLedger(userId, userName, ticketId, type, points, daysAgo, note) {
    ledger.push({
      id: 'L' + (ledger.length + 1),
      userId: userId, userName: userName, ticketId: ticketId,
      type: type, points: points, season: 2026,
      createdAt: now - daysAgo * D, note: note
    });
  }

  // 王强（IT1）历史流水
  addLedger('IT1', '王强', 'T1007', 'normal', 1, 1, '键盘失灵处理完成');
  addLedger('IT1', '王强', 'T1008', 'normal', 1, 2, 'VPN 连接失败处理完成');
  addLedger('IT1', '王强', 'T1010', 'self', 1, 4, '机房巡检（自创单）');
  addLedger('IT1', '王强', 'T1011', 'self', 1, 6, '批量补丁升级（自创单）');
  addLedger('IT1', '王强', '', 'normal', 1, 8, '显示器故障处理');
  addLedger('IT1', '王强', '', 'normal', 1, 9, '打印机共享设置');
  addLedger('IT1', '王强', '', 'normal', 1, 11, '浏览器主页修复');
  addLedger('IT1', '王强', '', 'normal', 1, 13, '账号权限调整');
  addLedger('IT1', '王强', '', 'urgent', 2, 15, '核心系统告警紧急处理');
  addLedger('IT1', '王强', '', 'urgent', 2, 18, '会议室投影紧急排查');
  addLedger('IT1', '王强', '', 'normal', 1, 20, '网线更换');
  addLedger('IT1', '王强', '', 'night', 2, 22, '夜间值守（夜班单 ×1.5）');
  addLedger('IT1', '王强', '', 'duty', 2, 25, '月度值守分');
  addLedger('IT1', '王强', '', 'knowledge', 3, 28, '整理《蓝屏排查手册》');
  addLedger('IT1', '王强', '', 'normal', 1, 30, '软件安装支持');
  addLedger('IT1', '王强', '', 'urgent', 2, 33, '机房空调告警处理');
  addLedger('IT1', '王强', '', 'normal', 1, 35, '邮箱签名配置');
  addLedger('IT1', '王强', '', 'duty', 2, 40, '月度值守分');
  addLedger('IT1', '王强', '', 'knowledge', 3, 45, '整理《VPN 常见问题》');
  addLedger('IT1', '王强', '', 'normal', 1, 48, '显示器支架更换');

  // 赵敏（IT2）历史流水
  addLedger('IT2', '赵敏', 'T1009', 'urgent', 2, 3, '电脑中毒处理完成');
  addLedger('IT2', '赵敏', '', 'normal', 1, 5, '网络端口排查');
  addLedger('IT2', '赵敏', '', 'night', 2, 7, '夜间值守');
  addLedger('IT2', '赵敏', '', 'night', 2, 12, '夜间值守');
  addLedger('IT2', '赵敏', '', 'normal', 1, 16, '系统重装');
  addLedger('IT2', '赵敏', '', 'duty', 2, 26, '月度值守分');
  addLedger('IT2', '赵敏', '', 'knowledge', 3, 32, '整理《Wi-Fi 排障清单》');

  // 陈刚（IT3，主管）
  addLedger('IT3', '陈刚', '', 'duty', 2, 6, '月度值守分');
  addLedger('IT3', '陈刚', '', 'normal', 1, 10, '协助处理网络故障');
  addLedger('IT3', '陈刚', '', 'knowledge', 3, 24, '编写《运维值班规范》');

  /* ---------- 消息通知 ---------- */
  var notifications = [
    { id: 'N1', type: 'new', title: '新工单待认领', body: 'T1001 台式机开机蓝屏（紧急），来自李明 A-301', ticketId: 'T1001', createdAt: now - 6 * M, read: false },
    { id: 'N2', type: 'new', title: '新工单待认领', body: 'T1002 无法连接公司内网 Wi-Fi，来自刘洋 B-102', ticketId: 'T1002', createdAt: now - 14 * M, read: false },
    { id: 'N3', type: 'remind', title: '超时提醒', body: 'T1004 ERP 登录缓慢，认领后已超过 2 小时未更新状态', ticketId: 'T1004', createdAt: now - 30 * M, read: false },
    { id: 'N4', type: 'point', title: '工单闭环，积分到账', body: 'T1007 键盘失灵处理完成，王强 +1 分', ticketId: 'T1007', createdAt: now - 1 * D + 2 * H, read: true },
    { id: 'N5', type: 'system', title: '赛季进度提醒', body: '2026 赛季已有 128 分，距「熟练」等级还差 0 分', ticketId: '', createdAt: now - 2 * D, read: true }
  ];

  /* ---------- 配置（全部可调） ---------- */
  var config = {
    normalPoints: 1,
    urgentPoints: 2,
    nightMultiplier: 1.5,
    dutyPoints: 2,
    selfPoints: 1,
    autoConfirmHours: 48,
    claimTimeoutMinutes: 15,
    seasonLevels: [100, 300, 600, 900, 1200],
    seasonLevelNames: ['见习', '熟练', '骨干', '专家', '传奇'],
    milestones: [50, 200, 500, 1000, 2000]
  };

  /* ---------- 本月班次声明 ---------- */
  var shift = { month: '2026-11', dayShiftUserId: 'IT1', nightShiftUserId: 'IT2' };

  /* ---------- 成就定义（check 接收统计对象） ---------- */
  var achievements = [
    { code: 'M1', name: '初出茅庐', icon: '🌱', type: '里程碑', desc: '完成第 1 个工单', check: function (s) { return s.closedCount >= 1; } },
    { code: 'M2', name: '渐入佳境', icon: '🌿', type: '里程碑', desc: '累计完成 10 个工单', check: function (s) { return s.closedCount >= 10; } },
    { code: 'M3', name: '独当一面', icon: '🌳', type: '里程碑', desc: '累计完成 50 个工单', check: function (s) { return s.closedCount >= 50; } },
    { code: 'M4', name: '行家里手', icon: '🏅', type: '里程碑', desc: '累计完成 200 个工单', check: function (s) { return s.closedCount >= 200; } },
    { code: 'M5', name: '传奇运维', icon: '👑', type: '里程碑', desc: '累计完成 500 个工单', check: function (s) { return s.closedCount >= 500; } },
    { code: 'H1', name: '硬件圣手', icon: '🔧', type: '专精', desc: '处理 10 个硬件类工单', check: function (s) { return (s.cat['硬件'] || 0) >= 10; } },
    { code: 'N1', name: '网络卫士', icon: '🌐', type: '专精', desc: '处理 10 个网络类工单', check: function (s) { return (s.cat['网络'] || 0) >= 10; } },
    { code: 'S1', name: '系统医生', icon: '💻', type: '专精', desc: '处理 10 个系统类工单', check: function (s) { return (s.cat['系统'] || 0) >= 10; } },
    { code: 'G1', name: '主动运维', icon: '🔍', type: '专精', desc: '完成 5 个自创单', check: function (s) { return (s.cat['自创'] || 0) >= 5; } },
    { code: 'Q1', name: '零漏接守护者', icon: '🛡️', type: '质量', desc: '月度团队零漏接', check: function (s) { return s.monthZeroMiss; } },
    { code: 'F1', name: '闪电响应', icon: '⚡', type: '时效', desc: '单日最快认领', check: function (s) { return s.closedCount >= 1; } },
    { code: 'K1', name: '知识贡献者', icon: '📚', type: '知识', desc: '贡献 5 条知识库', check: function (s) { return s.knowledgeCount >= 5; } },
    { code: 'Y1', name: '守夜人', icon: '🌙', type: '夜班', desc: '值夜班 10 次', check: function (s) { return s.nightCount >= 10; } },
    { code: 'T1', name: '团队之星', icon: '⭐', type: '团队', desc: '月度团队目标达成', check: function (s) { return s.monthZeroMiss && s.closedCount >= 20; } }
  ];

  return {
    version: 2,
    users: users,
    categories: categories,
    tickets: tickets,
    ledger: ledger,
    notifications: notifications,
    config: config,
    shift: shift,
    achievements: achievements,
    currentUserId: 'IT1'
  };
})();
