// English comments only per user request

function qs(id) {
  return document.getElementById(id);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function loadTheme() {
  // Persisted theme wins; otherwise follow system preference.
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = qs('themeToggle');
  if (btn) {
    const pressed = theme === 'light';
    btn.setAttribute('aria-pressed', String(pressed));
    btn.textContent = theme === 'light' ? '深色主题' : '浅色主题';
  }
}

function tokenizeGoal(goal) {
  return goal
    .trim()
    .replace(/\s+/g, ' ')
    .split(/[，。；;,.!？?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inferDomain(goal) {
  const g = goal.toLowerCase();
  if (/(web|网站|官网|landing|页面|前端|ui)/i.test(goal)) return 'web';
  if (/(数据|sql|报表|分析|etl|pipeline)/i.test(goal)) return 'data';
  if (/(客服|工单|运营|知识库|faq)/i.test(goal)) return 'ops';
  if (/(代码|测试|ci|bug|修复|重构|pr)/i.test(goal)) return 'dev';
  if (/(部署|k8s|容器|linux|服务器|监控)/i.test(goal)) return 'infra';
  return g.length > 80 ? 'general-large' : 'general';
}

function buildPlan(goal, opts) {
  const domain = inferDomain(goal);
  const parts = tokenizeGoal(goal);

  const steps = [];

  // Step 0: clarify success criteria
  if (opts.withSuccessCriteria) {
    steps.push({
      title: '定义成功标准与验收项',
      why: '可验证目标可以显著降低“看起来完成但其实没完成”的风险。',
      actions: [
        '列出必须交付的产物（文件/接口/页面/报告等）',
        '把关键要求改写成可测试条件（比如：通过测试、schema 校验、页面可访问）',
        '定义边界：不做什么、禁止行为、预算（时间/调用次数/成本）',
      ],
      tools: opts.withTools ? ['spec-checker.validate(requirements)'] : [],
    });
  }

  // Step 1: break down
  steps.push({
    title: '拆分任务与依赖',
    why: '把目标拆成可并行/可串行的步骤，降低复杂度。',
    actions: [
      `提取子目标：${parts.length ? parts.map((p) => `「${p}」`).join('、') : '从目标中抽取关键子任务'}`,
      '识别依赖关系与关键路径（先做最小可用版本）',
      '为每一步定义输入、输出与失败回滚方案',
    ],
    tools: opts.withTools ? ['planner.decompose(goal)', 'planner.orderByDependencies(tasks)'] : [],
  });

  // Domain-specific middle steps
  if (domain === 'web') {
    steps.push({
      title: '设计信息架构与页面结构',
      why: '先结构后内容，避免边做边改导致返工。',
      actions: ['确定页面模块（Hero/介绍/能力/架构/场景/Demo/FAQ）', '产出组件/区块清单与文案要点', '确定交互与可访问性要求'],
      tools: opts.withTools ? ['ui.generateWireframe(sections)', 'a11y.checklist()'] : [],
    });
    steps.push({
      title: '实现静态页面与样式',
      why: '先把关键路径跑通：打开即用、加载快、移动端友好。',
      actions: ['实现响应式布局与视觉层级', '加入暗/亮主题切换（可选）', '确保可读性与对比度'],
      tools: opts.withTools ? ['build.writeFiles(html, css, js)', 'lint.htmlcss()'] : [],
    });
    steps.push({
      title: '实现一个可交互 Demo（示意）',
      why: '用“可操作”的交互让用户理解 Agent 的闭环逻辑。',
      actions: ['输入目标 → 输出计划（结构化）', '支持复制结果', '输出包含：步骤、工具调用（示意）、风险与成功标准'],
      tools: opts.withTools ? ['demo.generatePlan(goal)', 'clipboard.copy(text)'] : [],
    });
  } else if (domain === 'dev') {
    steps.push({
      title: '定位问题与复现路径',
      why: '没有复现就没有可靠修复。',
      actions: ['收集日志/报错栈/版本信息', '写最小复现用例', '确定影响范围与回归测试'],
      tools: opts.withTools ? ['repo.search(symbols)', 'tests.run(target)'] : [],
    });
  } else if (domain === 'data') {
    steps.push({
      title: '明确数据口径与来源',
      why: '数据任务最常见的失败来自口径不一致。',
      actions: ['定义指标口径与时间窗口', '确认数据源与权限', '建立质量检查（缺失/异常/重复）'],
      tools: opts.withTools ? ['db.describe(tables)', 'dq.profile(dataset)'] : [],
    });
  } else if (domain === 'ops') {
    steps.push({
      title: '设计知识检索与回复策略',
      why: '避免编造，优先引用可追溯来源。',
      actions: ['定义知识库范围与更新流程', '设置置信度阈值与转人工策略', '记录对话与质检指标'],
      tools: opts.withTools ? ['kb.search(query)', 'policy.route(confidence)'] : [],
    });
  }

  // Guardrails
  if (opts.withGuardrails) {
    steps.push({
      title: '设置约束、权限与审计',
      why: '生产环境的 Agent 必须可控、可追踪。',
      actions: [
        '工具白名单：仅允许需要的能力（最小权限）',
        '加入敏感操作二次确认（删除/转账/发邮件/推送）',
        '记录执行轨迹：输入、计划、工具调用、结果与错误',
      ],
      tools: opts.withTools ? ['policy.enforce(allowlist)', 'audit.log(trace)'] : [],
    });
  }

  // Final verification
  steps.push({
    title: '验收与回归',
    why: '用客观检查收尾，避免“感觉差不多”。',
    actions: ['对照成功标准逐条验收', '补齐边界情况（空输入、超长输入、失败重试）', '沉淀可复用模板/脚手架'],
    tools: opts.withTools ? ['eval.run(criteria)', 'report.generate()'] : [],
  });

  // Format as text
  const lines = [];
  lines.push(`# Goal\n${goal.trim() || '(empty)'}\n`);
  lines.push(`# Meta\n- generated_at: ${nowISO()}\n- domain: ${domain}\n- steps: ${steps.length}\n`);
  lines.push(`# Plan`);

  steps.forEach((s, idx) => {
    lines.push(`\n## ${idx + 1}. ${s.title}`);
    lines.push(`- Why: ${s.why}`);
    lines.push(`- Actions:`);
    s.actions.forEach((a) => lines.push(`  - ${a}`));
    if (opts.withTools && s.tools && s.tools.length) {
      lines.push(`- Tool calls (illustrative):`);
      s.tools.forEach((t) => lines.push(`  - ${t}`));
    }
  });

  // Add a compact prompt template at the end
  const depth = clamp(goal.trim().length, 20, 240);
  lines.push(`\n# Prompt Template (copy/paste)`);
  lines.push(`你是一个可靠的 AI Agent。请根据以下目标生成可执行计划，并满足：`);
  if (opts.withSuccessCriteria) lines.push(`- 必须包含可验证的成功标准（可测条件）`);
  if (opts.withGuardrails) lines.push(`- 必须包含风险控制/权限边界/预算限制`);
  if (opts.withTools) lines.push(`- 输出工具调用建议（用占位函数名即可）`);
  lines.push(`- 输出结构：目标、约束、步骤（含输入/输出）、验证方式、失败回滚。`);
  lines.push(`\n目标：${goal.trim().slice(0, depth) || '(empty)'}`);

  return { text: lines.join('\n'), domain, steps: steps.length };
}

function initDemo() {
  const goal = qs('goal');
  const generate = qs('generate');
  const copy = qs('copy');
  const result = qs('result');
  const meta = qs('meta');
  const hint = qs('copyHint');

  const withSuccessCriteria = qs('withSuccessCriteria');
  const withGuardrails = qs('withGuardrails');
  const withTools = qs('withTools');

  function render(plan) {
    result.textContent = plan.text;
    meta.textContent = `domain=${plan.domain} • steps=${plan.steps}`;
  }

  generate.addEventListener('click', () => {
    const plan = buildPlan(goal.value, {
      withSuccessCriteria: Boolean(withSuccessCriteria.checked),
      withGuardrails: Boolean(withGuardrails.checked),
      withTools: Boolean(withTools.checked),
    });
    render(plan);
    hint.textContent = '已生成。你可以继续修改目标并再次生成。';
  });

  copy.addEventListener('click', async () => {
    const text = result.textContent || '';
    if (!text.trim()) {
      hint.textContent = '没有可复制内容，请先生成计划。';
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      hint.textContent = '已复制到剪贴板。';
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      hint.textContent = ok ? '已复制到剪贴板。' : '复制失败：浏览器不支持。';
    }
  });

  // Seed output
  render({ text: '在左侧输入目标，然后点击「生成计划」。', domain: '-', steps: 0 });
}

function initTheme() {
  const theme = loadTheme();
  applyTheme(theme);

  const btn = qs('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDemo();
});
