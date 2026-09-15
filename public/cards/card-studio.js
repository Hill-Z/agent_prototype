(() => {
  'use strict';

  const app = document.querySelector('#app');
  const toastNode = document.querySelector('#toast');
  const storageKey = 'uagent-card-studio-v4';
  const PAGE_SIZE = 6;
  const fieldTypes = { text: '文本', tag: '标签', image: '图片', link: '链接' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#3569ff';
  const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  let toastTimer;

  const makeField = (key, label, type, sample, description, extra = {}) => ({ id: uid('field'), key, label, type, sample, description, enabled: true, rules: [], ...extra });
  const makeAction = (label, target, extra = {}) => ({ id: uid('action'), label, action: 'speech', target, background: '#3569ff', textColor: '#ffffff', ...extra });
  const starterFields = archetype => archetype === 'product'
    ? [
        makeField('title', '商品名称', 'text', '轻量随行保温杯', '商品或服务的名称，简洁准确，不要自行扩写。'),
        makeField('imageUrl', '商品图片', 'image', '', '工具返回的商品主图 HTTPS 地址。'),
        makeField('price', '价格', 'text', '¥129.00', '商品当前价格，保留货币单位。'),
        makeField('sellingPoint', '商品亮点', 'text', '轻装出行，长效保温', '一句话概括最重要的卖点。'),
        makeField('status', '商品标签', 'tag', '新品', '根据工具返回值展示商品标签。', { rules: [{ value: '新品', label: '新品', color: '#23a66f' }, { value: '热销', label: '热销', color: '#e34f5f' }] })
      ]
    : [
        makeField('title', '标题', 'text', 'VPN 身份验证失败', '卡片主标题，概括本条业务记录。'),
        makeField('recordId', '业务编号', 'text', 'IT-260806-031', '工具返回的业务记录唯一编号。'),
        makeField('status', '处理状态', 'tag', '处理中', '当前处理状态，只使用工具返回的真实值。', { rules: [{ value: '待处理', label: '待处理', color: '#e99a2c' }, { value: '处理中', label: '处理中', color: '#3569ff' }, { value: '已完成', label: '已完成', color: '#23a66f' }] }),
        makeField('owner', '处理组', 'text', '网络支持组', '当前负责处理的团队或人员。'),
        makeField('progress', '最新处理', 'text', '已转交网络支持组处理', '最近一次有效处理进展，禁止推测。')
      ];

  const createTemplate = (id, name, archetype, description, mode = 'single') => ({
    id, name, archetype, description, mode, max: archetype === 'product' ? 6 : 5,
    fields: starterFields(archetype), actions: [makeAction(archetype === 'product' ? '立即了解' : '查看详情', archetype === 'product' ? '介绍一下 {{title}}' : '帮我查看 {{recordId}} 的详情')]
  });

  const examples = [
    createTemplate('service_progress', '服务进度', 'info', '展示一条服务记录的状态、负责人和最新进展。'),
    createTemplate('service_list', '服务记录列表', 'info', '集中展示多条服务记录，适合查询历史记录。', 'list'),
    createTemplate('plan_confirm', '套餐办理确认', 'info', '展示套餐信息并让用户立即办理或取消。'),
    createTemplate('refund_progress', '退款进度', 'info', '展示退款单号、金额、状态和预计到账时间。'),
    createTemplate('product_recommend', '商品推荐', 'product', '图文并列展示多个商品，支持横向浏览。', 'list'),
    createTemplate('product_detail', '商品介绍', 'product', '突出商品图片、价格、卖点和行动按钮。'),
    createTemplate('member_benefits', '会员权益', 'info', '展示会员等级、有效期和可用权益。'),
    createTemplate('store_recommend', '门店推荐', 'product', '使用图片和关键信息推荐附近门店。', 'list')
  ];

  let templates = loadTemplates();
  let view = 'home';
  let filter = 'all';
  let query = '';
  let page = 1;
  let draft = null;
  let editingId = null;
  let expandedField = null;
  let expandedAction = null;
  let modal = null;
  let deleteId = null;

  function loadTemplates() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.every(item => item.id && item.archetype && Array.isArray(item.fields))) return saved;
    } catch {}
    return clone(examples);
  }

  function persist() { localStorage.setItem(storageKey, JSON.stringify(templates)); }
  function toast(message) { toastNode.textContent = message; toastNode.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastNode.classList.remove('show'), 2400); }

  function templateType(template) { return template.archetype === 'product' ? '商品卡片' : '信息卡片'; }
  function listLabel(template) { return template.mode === 'single' ? '单卡' : template.archetype === 'product' ? '左右滑动' : '上下列表'; }

  function renderCard(template, index = 0, mini = false) {
    const fields = template.fields.filter(field => field.enabled);
    const image = template.archetype === 'product' ? fields.find(field => field.type === 'image') : null;
    const title = fields.find(field => field.type === 'text');
    const headerTag = fields.find(field => field.type === 'tag');
    const body = fields.filter(field => field !== title && field !== image && field !== headerTag).map(field => {
      let sample = field.sample || '暂无信息';
      if (index && /编号|单号/.test(field.label)) sample = `${sample}-${index + 1}`;
      if (field.type === 'tag') {
        const rule = (field.rules || []).find(item => item.value === sample);
        const tone = color(rule?.color || '#3569ff');
        sample = `<span class="tag-value" style="color:${tone};background:${tone}18">${esc(rule?.label || sample)}</span>`;
      } else if (field.type === 'link') {
        sample = `<span style="color:#3569ff">${esc(field.linkText || sample)}</span>`;
      } else sample = esc(sample);
      return `<div class="data-row"><span class="label">${esc(field.label)}</span><span class="value">${sample}</span></div>`;
    }).join('');
    const imageUrl = image && safeUrl(image.sample);
    const actions = template.actions.slice(0, 2).map(action => `<button type="button" data-preview-action="${esc(action.id)}" style="background:${color(action.background)};color:${color(action.textColor)};border-color:${color(action.background)}">${esc(action.label || '按钮')}</button>`).join('');
    return `<article class="message-card ${template.archetype === 'product' ? 'product-card' : ''}">
      ${image ? `<div class="card-image">${imageUrl ? `<img src="${esc(imageUrl)}" alt="${esc(image.label)}">` : '<span>▧</span>'}</div>` : ''}
      <div class="card-main"><div class="card-title-row"><h3>${esc(title?.sample || template.name || '卡片标题')}</h3>${headerTag ? renderHeaderTag(headerTag) : ''}</div>${body || '<p>添加字段后在这里预览。</p>'}</div>
      ${actions && !mini ? `<div class="card-actions">${actions}</div>` : ''}
    </article>`;
  }

  function renderHeaderTag(field) {
    const rule = (field.rules || []).find(item => item.value === field.sample);
    const tone = color(rule?.color || '#3569ff');
    return `<span class="tag-value" style="color:${tone};background:${tone}18">${esc(rule?.label || field.sample)}</span>`;
  }

  function renderPreview(template, mini = false) {
    const count = template.mode === 'list' ? Math.min(Number(template.max) || 3, mini ? 1 : 3) : 1;
    const cards = Array.from({ length: count }, (_, index) => renderCard(template, index, mini)).join('');
    return `<div class="card-list ${template.mode === 'list' && template.archetype === 'product' ? 'horizontal' : ''}">${cards}</div>${template.mode === 'list' && !mini ? `<div class="more">${template.archetype === 'product' ? '← 左右滑动 →' : `最多展示 ${template.max} 条`}</div>` : ''}`;
  }

  function renderHome() {
    const matches = templates.filter(template => (filter === 'all' || template.archetype === filter) && `${template.name} ${template.id} ${template.description}`.toLowerCase().includes(query.toLowerCase()));
    const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    app.innerHTML = `<section class="page">
      <header class="page-head"><div><h1>卡片模板</h1><p>统一管理智能体可使用的自定义卡片，让工具数据以更清楚、更醒目的方式呈现。</p></div><button class="primary" data-action="new">＋ 新建模板</button></header>
      <div class="toolbar"><nav class="tabs">${[['all','全部'],['info','信息卡片'],['product','商品卡片']].map(([key,label]) => `<button class="${filter === key ? 'active' : ''}" data-filter="${key}">${label}</button>`).join('')}</nav><label class="search"><input id="search" value="${esc(query)}" placeholder="搜索名称或模板标识"></label><span class="result-count">${matches.length} 个模板</span></div>
      <div class="template-grid">${visible.map(template => `<article class="template-tile"><div class="tile-preview">${renderPreview(template, true)}</div><div class="tile-info"><div class="tile-title"><h3>${esc(template.name)}</h3><span class="kind ${template.archetype}">${templateType(template)}</span></div><div class="template-id">${esc(template.id)}</div><p class="tile-desc">${esc(template.description)}</p><div class="tile-meta"><span>${listLabel(template)}</span><span>${template.fields.length} 个字段</span><span>${template.actions.length} 个按钮</span></div><div class="tile-actions"><button class="link-btn" data-edit="${esc(template.id)}">编辑</button><button class="link-btn" data-preview="${esc(template.id)}">预览</button><button class="link-btn danger delete" data-delete-template="${esc(template.id)}">删除</button></div></div></article>`).join('') || '<div class="empty">没有找到模板，可以新建一个。</div>'}</div>
      ${pages > 1 ? `<div class="pagination"><button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, index) => `<button class="${page === index + 1 ? 'active' : ''}" data-page="${index + 1}">${index + 1}</button>`).join('')}<button data-page="${page + 1}" ${page === pages ? 'disabled' : ''}>›</button></div>` : ''}
    </section>${renderModal()}`;
  }

  function renderEditor() {
    app.innerHTML = `<section><header class="editor-top"><button class="ghost" data-action="back">←</button><span class="crumb">卡片模板 /</span><strong>${editingId ? '编辑模板' : '新建模板'}</strong><div class="editor-actions"><button data-action="back">取消</button><button class="primary" data-action="save">${editingId ? '保存修改' : '创建模板'}</button></div></header>
      <div class="editor-layout"><form class="editor-form" id="editor-form">
        <section class="panel"><div class="panel-head"><h2>基本信息</h2></div><div class="panel-body"><div class="form-grid">
          <label class="form-item"><span class="required">模板名称</span><input data-root="id" value="${esc(draft.id)}" placeholder="例如 service_progress"><small>唯一英文标识，工具通过 cardHint.type 引用。</small></label>
          <label class="form-item"><span class="required">显示名称</span><input data-root="name" value="${esc(draft.name)}" placeholder="例如 服务进度"></label>
          <label class="form-item wide"><span class="required">模板描述</span><textarea data-root="description" rows="2" placeholder="说明这个模板适合在什么场景使用">${esc(draft.description)}</textarea><small>帮助配置人员和智能体理解模板用途，不作为卡片内容展示。</small></label>
        </div></div></section>
        <section class="panel"><div class="panel-head"><h2>卡片样式</h2></div><div class="panel-body"><div class="type-summary"><span class="type-icon ${draft.archetype}">${draft.archetype === 'product' ? '▧' : '▤'}</span><div><strong>${templateType(draft)}</strong><p>${draft.archetype === 'product' ? '图片主导；列表固定左右滑动，适合商品、门店和内容推荐。' : '信息纵向排列；列表固定上下展示，适合工单、订单、会员和办理确认。'}</p></div></div><div class="choice-row"><button type="button" class="choice ${draft.mode === 'single' ? 'active' : ''}" data-mode="single"><i></i><span><strong>单张卡片</strong><br><small>每次展示一条数据</small></span></button><button type="button" class="choice ${draft.mode === 'list' ? 'active' : ''}" data-mode="list"><i></i><span><strong>卡片列表</strong><br><small>同一结构展示多条数据</small></span></button></div>${draft.mode === 'list' ? `<div class="list-options"><strong>列表规则</strong><div class="form-grid"><label class="form-item"><span>排列方式</span><input value="${draft.archetype === 'product' ? '左右滑动' : '上下排列'}" disabled></label><label class="form-item"><span>最大展示数量</span><input data-root="max" type="number" min="1" max="10" value="${esc(draft.max)}"><small>支持 1–10 条，超出由渠道提供更多入口。</small></label></div></div>` : ''}</div></section>
        <section class="panel"><div class="panel-head row"><div><h2>展示字段</h2><p>字段绑定工具返回值；字段说明会提供给大模型，帮助它准确填充卡片。</p></div><button type="button" class="link-btn" data-action="add-field">＋ 添加字段</button></div><div class="fields-list">${draft.fields.map((field,index) => renderField(field,index)).join('') || '<div class="empty-section">暂无展示字段</div>'}</div></section>
        <section class="panel"><div class="panel-head row"><div><h2>操作按钮</h2><p>按钮统一放在卡片底部，最多两个；可发送话术或打开链接。</p></div><button type="button" class="link-btn" data-action="add-action" ${draft.actions.length >= 2 ? 'disabled' : ''}>＋ 添加按钮</button></div><div class="actions-list">${draft.actions.map((action,index) => renderAction(action,index)).join('') || '<div class="empty-section">暂无按钮，卡片仅展示信息。</div>'}</div><div class="panel-body"><span class="limit-hint ${draft.actions.length > 2 ? 'error' : ''}">已配置 ${draft.actions.length}/2 个按钮。不同渠道会将颜色适配为最接近的可用样式。</span></div></section>
      </form><aside class="preview-pane"><div class="preview-head"><h2>实时预览</h2><span>● 自动更新</span></div><div class="preview-stage"><div class="assistant-label">智能助手 · 卡片消息</div><div id="preview-content">${renderPreview(draft)}</div><div id="preview-feedback" class="preview-feedback hidden"></div></div><p class="preview-note">预览会随可用宽度自动适应。实际效果由各渠道按同一结构转换，能力不支持时展示可读文本。</p><div class="model-schema"><strong>数据绑定示例</strong><span>cardHint.type: ${esc(draft.id || 'template_name')}</span><br><span>${draft.fields.slice(0,3).map(field => `${esc(field.key)} ← ${esc(field.key)}`).join('<br>')}</span></div></aside></div>
    </section>${renderModal()}`;
  }

  function renderField(field, index) {
    const open = expandedField === field.id;
    return `<div class="field-box" data-field-id="${esc(field.id)}" draggable="true"><div class="field-summary"><span class="drag">⠿</span><span class="index">${String(index + 1).padStart(2, '0')}</span><strong>${esc(field.label || '未命名字段')}</strong><code>${esc(field.key || '未绑定')}</code><span class="kind">${fieldTypes[field.type]}</span><span class="spacer"></span><button type="button" data-move-field="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-field="1" ${index === draft.fields.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-toggle-field="${esc(field.id)}">${open ? '收起' : '配置'}</button><button type="button" class="danger" data-remove-field="${esc(field.id)}">删除</button></div>${open ? `<div class="field-editor"><div class="form-grid">
      <label class="form-item"><span class="required">显示名称</span><input data-field="label" value="${esc(field.label)}"></label><label class="form-item"><span class="required">数据字段</span><input data-field="key" value="${esc(field.key)}" placeholder="例如 ticket.status"><small>支持对象路径，如 order.customer.name。</small></label>
      <label class="form-item"><span>显示类型</span><select data-field="type">${Object.entries(fieldTypes).map(([key,label]) => `<option value="${key}" ${field.type === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="form-item"><span>示例内容</span><input data-field="sample" value="${esc(field.sample)}" placeholder="用于右侧预览"></label>
      <label class="form-item wide"><span class="required">字段说明（给大模型）</span><textarea class="description-area" data-field="description" rows="2" placeholder="说明字段含义、填写规则和禁止推测的内容">${esc(field.description)}</textarea><small>越明确，大模型越容易从工具结果中选对值；这里不会展示给最终用户。</small></label>
      ${fieldTypeEditor(field)}
      <label class="form-item"><span>字段状态</span><select data-field="enabled"><option value="true" ${field.enabled ? 'selected' : ''}>显示</option><option value="false" ${!field.enabled ? 'selected' : ''}>暂不显示</option></select></label>
    </div></div>` : ''}</div>`;
  }

  function fieldTypeEditor(field) {
    if (field.type === 'tag') return `<div class="tag-rules"><div class="type-help">业务值与标签颜色由模板规则决定，智能体只填业务值，不能临时选择颜色。</div>${(field.rules || []).map((rule,index) => `<div class="rule-row"><input data-rule-index="${index}" data-rule="value" value="${esc(rule.value)}" placeholder="业务返回值"><input data-rule-index="${index}" data-rule="label" value="${esc(rule.label)}" placeholder="显示文字"><span class="color-input"><input type="color" data-rule-index="${index}" data-rule="color" value="${color(rule.color)}"><input type="text" data-rule-index="${index}" data-rule="color" value="${color(rule.color)}"></span><button type="button" class="danger" data-remove-rule="${index}">×</button></div>`).join('')}<button type="button" class="link-btn" data-add-rule>＋ 添加标签规则</button></div>`;
    if (field.type === 'image') return `<label class="form-item"><span>图片比例</span><select data-field="ratio"><option ${field.ratio === '1/1' ? 'selected' : ''}>1/1</option><option ${field.ratio !== '1/1' ? 'selected' : ''}>16/9</option></select></label><div class="type-help wide">图片建议使用 HTTPS 地址；加载失败或渠道不支持时显示占位图。</div>`;
    if (field.type === 'link') return `<label class="form-item"><span>链接文字</span><input data-field="linkText" value="${esc(field.linkText || '查看详情')}"></label><div class="type-help wide">链接字段展示为文字链接。需要更醒目的操作，请改用底部按钮。</div>`;
    return `<label class="form-item"><span>最多显示行数</span><select data-field="lines">${[1,2,3,5].map(line => `<option value="${line}" ${Number(field.lines || 2) === line ? 'selected' : ''}>${line} 行</option>`).join('')}</select></label>`;
  }

  function renderAction(action, index) {
    const open = expandedAction === action.id;
    return `<div class="field-box" data-action-id="${esc(action.id)}"><div class="field-summary"><span class="index">${String(index + 1).padStart(2, '0')}</span><strong>${esc(action.label || '未命名按钮')}</strong><span class="kind">${action.action === 'link' ? '打开链接' : '发送话术'}</span><span class="spacer"></span><button type="button" data-toggle-action="${esc(action.id)}">${open ? '收起' : '配置'}</button><button type="button" class="danger" data-remove-action="${esc(action.id)}">删除</button></div>${open ? `<div class="field-editor"><div class="form-grid"><label class="form-item"><span class="required">按钮文字</span><input data-button="label" value="${esc(action.label)}"></label><label class="form-item"><span>点击动作</span><select data-button="action"><option value="speech" ${action.action === 'speech' ? 'selected' : ''}>发送话术</option><option value="link" ${action.action === 'link' ? 'selected' : ''}>打开链接</option></select></label><label class="form-item wide"><span class="required">${action.action === 'link' ? '跳转链接' : '输出话术'}</span><textarea data-button="target" rows="2" placeholder="${action.action === 'link' ? 'https://example.com/detail/{{recordId}}' : '帮我查看 {{recordId}} 的详情'}">${esc(action.target)}</textarea><small>使用 {{数据字段}} 引用当前卡片的数据，例如 {{recordId}}。</small></label><label class="form-item"><span>插入字段</span><select data-insert><option value="">选择字段</option>${draft.fields.map(field => `<option value="${esc(field.key)}">${esc(field.label)} · ${esc(field.key)}</option>`).join('')}</select></label><div></div><div class="button-colors wide"><label class="form-item"><span>背景颜色</span><span class="color-input"><input type="color" data-button="background" value="${color(action.background)}"><input type="text" data-button="background" value="${color(action.background)}"></span></label><label class="form-item"><span>文字颜色</span><span class="color-input"><input type="color" data-button="textColor" value="${color(action.textColor)}"><input type="text" data-button="textColor" value="${color(action.textColor)}"></span></label></div><div class="button-color-preview wide" style="background:${color(action.background)};color:${color(action.textColor)}">${esc(action.label || '按钮效果')}</div></div></div>` : ''}</div>`;
  }

  function renderModal() {
    if (!modal) return '';
    if (modal === 'starter') return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>选择卡片类型</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><div class="starter-grid"><button class="starter" data-starter="info"><span class="type-icon">▤</span><h3>信息卡片</h3><p>让业务信息规整、醒目，快速看到状态和关键字段。</p><ul><li>支持单张或上下列表</li><li>适合工单、订单、套餐、会员</li><li>可配置文本、标签、链接和按钮</li></ul></button><button class="starter" data-starter="product"><span class="type-icon product">▧</span><h3>商品卡片</h3><p>图片主导的推荐卡片，突出价格、卖点和行动入口。</p><ul><li>支持单张或左右滑动列表</li><li>适合商品、门店、内容推荐</li><li>默认包含图片字段</li></ul></button></div></div></section></div>`;
    if (modal === 'addField') return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>添加展示字段</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><div class="form-grid"><label class="form-item"><span class="required">显示名称</span><input id="new-label" placeholder="例如 处理状态"></label><label class="form-item"><span class="required">数据字段</span><input id="new-key" placeholder="例如 status"></label><label class="form-item"><span>显示类型</span><select id="new-type">${Object.entries(fieldTypes).map(([key,label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label class="form-item"><span>示例内容</span><input id="new-sample" placeholder="用于实时预览"></label><label class="form-item wide"><span class="required">字段说明（给大模型）</span><textarea id="new-description" rows="3" placeholder="说明字段含义、取值要求，以及信息缺失时如何处理"></textarea></label></div></div><footer class="modal-actions"><button data-close-modal>取消</button><button class="primary" data-confirm-field>添加字段</button></footer></section></div>`;
    if (modal === 'preview') { const template = templates.find(item => item.id === deleteId); return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>${esc(template?.name)}</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><div class="preview-stage">${template ? renderPreview(template) : ''}</div></div><footer class="modal-actions"><button data-close-modal>关闭</button><button class="primary" data-edit="${esc(template?.id)}">编辑模板</button></footer></section></div>`; }
    const template = templates.find(item => item.id === deleteId);
    return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>删除模板</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><p class="confirm-copy">确定删除“${esc(template?.name)}”吗？删除后，引用该模板的工具或 Skill 将无法生成卡片。</p></div><footer class="modal-actions"><button data-close-modal>取消</button><button class="primary" data-confirm-delete>确认删除</button></footer></section></div>`;
  }

  function openEditor(template) {
    editingId = template?.id || null;
    draft = template ? clone(template) : null;
    expandedField = draft?.fields[0]?.id || null;
    expandedAction = null;
    view = 'editor'; modal = null; render();
  }

  function start(archetype) {
    draft = createTemplate('', '', archetype, '', 'single');
    editingId = null; expandedField = draft.fields[0]?.id; expandedAction = null; view = 'editor'; modal = null; render();
  }

  function render() { view === 'home' ? renderHome() : renderEditor(); }
  function updatePreview() { const node = document.querySelector('#preview-content'); if (node) node.innerHTML = renderPreview(draft); }
  function fieldByNode(node) { const box = node.closest('[data-field-id]'); return draft.fields.find(field => field.id === box?.dataset.fieldId); }
  function actionByNode(node) { const box = node.closest('[data-action-id]'); return draft.actions.find(action => action.id === box?.dataset.actionId); }

  app.addEventListener('input', event => {
    const target = event.target;
    if (target.dataset.root) {
      draft[target.dataset.root] = target.dataset.root === 'max' ? Math.max(1, Math.min(10, Number(target.value) || 1)) : target.value;
      updatePreview(); return;
    }
    if (target.dataset.field) {
      const field = fieldByNode(target); if (!field) return;
      field[target.dataset.field] = target.dataset.field === 'enabled' ? target.value === 'true' : target.value;
      if (target.dataset.field === 'type') { field.rules ||= []; renderEditor(); } else updatePreview();
      return;
    }
    if (target.dataset.rule) {
      const field = fieldByNode(target); const rule = field?.rules?.[Number(target.dataset.ruleIndex)]; if (!rule) return;
      rule[target.dataset.rule] = target.value; updatePreview(); return;
    }
    if (target.dataset.button) {
      const action = actionByNode(target); if (!action) return;
      action[target.dataset.button] = target.value;
      if (target.dataset.button === 'action') renderEditor(); else updatePreview();
    }
  });

  app.addEventListener('change', event => {
    const target = event.target;
    if (target.matches('[data-insert]') && target.value) {
      const action = actionByNode(target); action.target += `{{${target.value}}}`; renderEditor();
    }
  });

  app.addEventListener('click', event => {
    const target = event.target.closest('button'); if (!target) return;
    if (target.dataset.action === 'new') { modal = 'starter'; renderHome(); return; }
    if (target.dataset.closeModal !== undefined) { modal = null; render(); return; }
    if (target.dataset.starter) { start(target.dataset.starter); return; }
    if (target.dataset.filter) { filter = target.dataset.filter; page = 1; renderHome(); return; }
    if (target.dataset.page) { page = Number(target.dataset.page); renderHome(); return; }
    if (target.dataset.edit) { openEditor(templates.find(item => item.id === target.dataset.edit)); return; }
    if (target.dataset.preview) { deleteId = target.dataset.preview; modal = 'preview'; renderHome(); return; }
    if (target.dataset.deleteTemplate) { deleteId = target.dataset.deleteTemplate; modal = 'delete'; renderHome(); return; }
    if (target.dataset.confirmDelete !== undefined) { templates = templates.filter(item => item.id !== deleteId); persist(); modal = null; renderHome(); toast('模板已删除'); return; }
    if (target.dataset.action === 'back') { view = 'home'; draft = null; modal = null; renderHome(); return; }
    if (target.dataset.action === 'save') { saveDraft(); return; }
    if (target.dataset.mode) { draft.mode = target.dataset.mode; renderEditor(); return; }
    if (target.dataset.action === 'add-field') { modal = 'addField'; renderEditor(); return; }
    if (target.dataset.confirmField !== undefined) { addFieldFromModal(); return; }
    if (target.dataset.toggleField) { expandedField = expandedField === target.dataset.toggleField ? null : target.dataset.toggleField; renderEditor(); return; }
    if (target.dataset.removeField) { draft.fields = draft.fields.filter(field => field.id !== target.dataset.removeField); renderEditor(); return; }
    if (target.dataset.moveField) { moveField(fieldByNode(target), Number(target.dataset.moveField)); return; }
    if (target.dataset.addRule !== undefined) { const field = fieldByNode(target); field.rules.push({ value: '', label: '', color: '#3569ff' }); renderEditor(); return; }
    if (target.dataset.removeRule !== undefined) { const field = fieldByNode(target); field.rules.splice(Number(target.dataset.removeRule), 1); renderEditor(); return; }
    if (target.dataset.action === 'add-action') { if (draft.actions.length >= 2) return; const action = makeAction(`按钮 ${draft.actions.length + 1}`, ''); draft.actions.push(action); expandedAction = action.id; renderEditor(); return; }
    if (target.dataset.toggleAction) { expandedAction = expandedAction === target.dataset.toggleAction ? null : target.dataset.toggleAction; renderEditor(); return; }
    if (target.dataset.removeAction) { draft.actions = draft.actions.filter(action => action.id !== target.dataset.removeAction); renderEditor(); return; }
    if (target.dataset.previewAction) { previewAction(target.dataset.previewAction); }
  });

  app.addEventListener('input', event => { if (event.target.id === 'search') { query = event.target.value; page = 1; renderHome(); document.querySelector('#search')?.focus(); } });

  app.addEventListener('dragstart', event => { const box = event.target.closest('[data-field-id]'); if (box) event.dataTransfer.setData('text/plain', box.dataset.fieldId); });
  app.addEventListener('dragover', event => { if (event.target.closest('[data-field-id]')) event.preventDefault(); });
  app.addEventListener('drop', event => { const box = event.target.closest('[data-field-id]'); if (!box) return; event.preventDefault(); const source = draft.fields.findIndex(field => field.id === event.dataTransfer.getData('text/plain')); const destination = draft.fields.findIndex(field => field.id === box.dataset.fieldId); if (source >= 0 && destination >= 0 && source !== destination) { const [field] = draft.fields.splice(source, 1); draft.fields.splice(destination, 0, field); renderEditor(); } });

  function moveField(field, direction) { const index = draft.fields.indexOf(field); const next = index + direction; if (index < 0 || next < 0 || next >= draft.fields.length) return; [draft.fields[index], draft.fields[next]] = [draft.fields[next], draft.fields[index]]; renderEditor(); }

  function addFieldFromModal() {
    const label = document.querySelector('#new-label')?.value.trim();
    const key = document.querySelector('#new-key')?.value.trim();
    const description = document.querySelector('#new-description')?.value.trim();
    const type = document.querySelector('#new-type')?.value;
    const sample = document.querySelector('#new-sample')?.value;
    if (!label || !key || !description) { toast('请填写显示名称、数据字段和字段说明'); return; }
    if (!/^[a-zA-Z][\w.]*$/.test(key)) { toast('数据字段需以字母开头，仅支持字母、数字、下划线和点'); return; }
    const field = makeField(key, label, type, sample, description);
    if (type === 'tag') field.rules = [{ value: sample || '进行中', label: sample || '进行中', color: '#3569ff' }];
    draft.fields.push(field); expandedField = field.id; modal = null; renderEditor();
  }

  function validate() {
    draft.id = draft.id.trim(); draft.name = draft.name.trim(); draft.description = draft.description.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(draft.id)) return '模板名称需以小写字母开头，仅支持小写字母、数字和下划线';
    if (templates.some(item => item.id === draft.id && item.id !== editingId)) return '模板名称已存在';
    if (!draft.name) return '请填写显示名称';
    if (!draft.description) return '请填写模板描述';
    if (!draft.fields.length) return '请至少添加一个展示字段';
    if (draft.fields.some(field => !field.label.trim() || !field.key.trim() || !field.description.trim())) return '请完整填写每个字段的名称、数据字段和字段说明';
    if (new Set(draft.fields.map(field => field.key)).size !== draft.fields.length) return '数据字段不能重复';
    if (draft.actions.length > 2) return '操作按钮最多两个';
    if (draft.actions.some(action => !action.label.trim() || !action.target.trim())) return '请完整配置按钮文字和动作内容';
    if (draft.actions.some(action => action.action === 'link' && !/^https?:\/\//.test(action.target.replace(/\{\{[^}]+\}\}/g, 'value')))) return '跳转链接必须使用完整的 http 或 https 地址';
    return '';
  }

  function saveDraft() {
    const error = validate(); if (error) { toast(error); return; }
    templates = templates.filter(item => item.id !== editingId); templates.unshift(clone(draft)); persist(); editingId = draft.id; view = 'home'; renderHome(); toast('模板已保存，可供工具或 Skill 引用');
  }

  function previewAction(id) {
    const action = draft.actions.find(item => item.id === id); const node = document.querySelector('#preview-feedback'); if (!action || !node) return;
    const resolved = action.target.replace(/\{\{([^}]+)\}\}/g, (_, key) => draft.fields.find(field => field.key === key)?.sample || `{{${key}}}`);
    node.textContent = action.action === 'link' ? `将打开：${resolved}` : `用户发送：${resolved}`; node.classList.remove('hidden');
  }

  render();
})();
