(() => {
  'use strict';

  const app = document.querySelector('#app');
  const toastNode = document.querySelector('#toast');
  const storageKey = 'uagent-card-studio-v5';
  const PAGE_SIZE = 8;
  const fieldTypes = { text: '文本', tag: '标签', image: '图片', link: '链接' };
  const productImages = [
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80'
  ];
  const productSamples = [
    { title: '轻量随行保温杯', price: '¥129.00', sellingPoint: '轻装出行，长效保温', status: '新品,热销' },
    { title: '降噪无线耳机', price: '¥399.00', sellingPoint: '沉浸聆听，全天续航', status: '推荐,包邮' },
    { title: '简约智能腕表', price: '¥259.00', sellingPoint: '健康监测，消息提醒', status: '新品,限时' }
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const color = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#3569ff';
  const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  let toastTimer;

  const makeField = (key, label, type, sample, description, extra = {}) => ({ id: uid('field'), key, label, type, sample, description, source: 'field', defaultValue: '', fixedValue: '', enabled: true, rules: [], ...extra });
  const makeAction = (label, target, extra = {}) => ({ id: uid('action'), label, action: 'speech', target, background: '#3569ff', textColor: '#ffffff', ...extra });
  const starterFields = archetype => archetype === 'product'
    ? [
        makeField('title', '商品名称', 'text', '轻量随行保温杯', '商品或服务的名称，简洁准确，不要自行扩写。'),
        makeField('imageUrl', '商品图片', 'image', productImages[0], '工具返回的商品主图地址。'),
        makeField('price', '价格', 'text', '¥129.00', '商品当前价格，保留货币单位。'),
        makeField('sellingPoint', '商品卖点', 'text', '轻装出行，长效保温', '一句话概括最重要的卖点。'),
        makeField('badge', '商品亮点', 'tag', '', '', { source: 'fixed', fixedValue: '新品', tagColor: '#23a66f', tagPreview: 'single' })
      ]
    : [
        makeField('title', '标题', 'text', 'VPN 身份验证失败', '卡片主标题，概括本条业务记录。'),
        makeField('recordId', '业务编号', 'text', 'IT-260806-031', '工具返回的业务记录唯一编号。'),
        makeField('status', '处理状态', 'tag', '处理中', '当前处理状态，只使用工具返回的真实值。', { tagColor: '#3569ff', tagPreview: 'single' }),
        makeField('owner', '处理组', 'text', '网络支持组', '当前负责处理的团队或人员。'),
        makeField('progress', '最新处理', 'text', '已转交网络支持组处理', '最近一次有效处理进展，禁止推测。')
      ];

  const createTemplate = (id, name, archetype, description, mode = 'single') => ({
    id, name, archetype, description, mode, max: archetype === 'product' ? 6 : 5,
    fields: starterFields(archetype), actions: [makeAction(archetype === 'product' ? '立即了解' : '查看详情', archetype === 'product' ? '介绍一下 {{title}}' : '帮我查看 {{recordId}} 的详情')]
  });

  const udeskTicketFields = () => [
    makeField('subject', '工单标题', 'text', '办公室打印机无法连接', '工单标题。', { defaultValue: '未命名工单' }),
    makeField('field_num', '工单编号', 'text', '#638', '系统生成的工单编号。'),
    makeField('status', '处理状态', 'tag', '解决中', '工单当前状态。', { defaultValue: '开启', tagColor: '#3569ff', tagPreview: 'single' }),
    makeField('priority', '优先级', 'text', '高', '工单优先级。', { defaultValue: '标准' }),
    makeField('user_group_name', '受理客服组', 'text', '桌面支持组', '当前受理客服组。', { defaultValue: '待分配' }),
    makeField('assignee_name', '受理客服', 'text', '王小明', '当前受理客服姓名。', { defaultValue: '待分配' }),
    makeField('platform', '来源渠道', 'text', '在线客服', '工单来源渠道。', { defaultValue: '未知渠道' }),
    makeField('custom_fields.TextField_38', '办公区域', 'text', '上海二楼 A 区', '客户工单中的办公区域自定义字段。', { defaultValue: '未填写' }),
    makeField('tags', '工单标签', 'tag', '办公设备,硬件故障', '工单标签，支持逗号字符串或数组。', { tagColor: '#6c63d9', tagPreview: 'multiple' }),
    makeField('updated_at', '最近更新', 'text', '2026-09-16 10:24', '工单最近更新时间。')
  ];

  const ticketDetail = createTemplate('udesk_ticket_detail', 'Udesk 工单详情', 'info', '根据 Udesk 工单详情接口展示真实工单信息。');
  ticketDetail.fields = udeskTicketFields();
  ticketDetail.actions = [makeAction('查看处理记录', '帮我查看工单 {{field_num}} 的处理记录')];

  const ticketList = createTemplate('udesk_ticket_list', '我的工单', 'info', '展示当前客户的多条工单及处理状态。', 'list');
  ticketList.fields = udeskTicketFields().filter(field => ['subject','field_num','status','priority','user_group_name','updated_at'].includes(field.key));
  ticketList.actions = [makeAction('查看详情', '帮我查看工单 {{field_num}} 的详情')];

  const planConfirm = createTemplate('plan_confirm', '套餐办理确认', 'info', '确认套餐名称、费用和生效时间后再办理。');
  planConfirm.fields = [
    makeField('plan_name', '套餐名称', 'text', '企业畅享版', '待办理套餐名称。'),
    makeField('price', '套餐费用', 'text', '¥99/月', '套餐费用。'),
    makeField('effective_at', '生效时间', 'text', '立即生效', '套餐生效时间。', { defaultValue: '立即生效' }),
    makeField('confirm_badge', '当前状态', 'tag', '', '', { source: 'fixed', fixedValue: '待确认', tagColor: '#e99a2c', tagPreview: 'single' })
  ];
  planConfirm.actions = [makeAction('确认办理', '确认办理 {{plan_name}}'), makeAction('暂不办理', '暂不办理', { background: '#ffffff', textColor: '#3569ff' })];

  const refund = createTemplate('refund_progress', '退款进度', 'info', '展示退款金额、处理状态和预计到账时间。');
  refund.fields = [
    makeField('refund_no', '退款单号', 'text', 'RF20260916008', '退款单编号。'),
    makeField('amount', '退款金额', 'text', '¥299.00', '退款金额。'),
    makeField('status', '退款状态', 'tag', '银行处理中', '退款当前状态。', { defaultValue: '处理中', tagColor: '#3569ff' }),
    makeField('arrival_at', '预计到账', 'text', '1—3 个工作日', '预计到账时间。', { defaultValue: '以银行处理时间为准' })
  ];

  const productRecommend = createTemplate('product_recommend', '商品推荐', 'product', '横向浏览多个商品并快速了解或购买。', 'list');
  const productDetail = createTemplate('product_detail', '商品介绍', 'product', '展示商品图片、价格、卖点和购买入口。');
  productDetail.fields.find(field => field.key === 'title').sample = '降噪无线耳机';
  productDetail.fields.find(field => field.type === 'image').sample = productImages[1];
  productDetail.fields.find(field => field.key === 'price').sample = '¥399.00';
  productDetail.fields.find(field => field.key === 'sellingPoint').sample = '沉浸降噪，全天舒适佩戴';
  productDetail.fields.find(field => field.key === 'badge').fixedValue = '热销';
  productDetail.actions = [makeAction('立即购买', '我要购买 {{title}}')];
  const storeRecommend = createTemplate('store_recommend', '附近门店', 'product', '用图片展示附近门店、距离和营业状态。', 'list');
  storeRecommend.fields = [
    makeField('name', '门店名称', 'text', 'Udesk 服务中心·静安店', '门店名称。'),
    makeField('imageUrl', '门店图片', 'image', productImages[2], '门店主图地址。'),
    makeField('distance', '距离', 'text', '距你 1.2 km', '用户当前位置到门店的距离。'),
    makeField('address', '门店地址', 'text', '南京西路 888 号', '门店地址。'),
    makeField('open_badge', '营业状态', 'tag', '', '', { source: 'fixed', fixedValue: '营业中', tagColor: '#23a66f' })
  ];
  storeRecommend.actions = [makeAction('导航到店', '帮我导航到 {{name}}')];

  const memberBenefits = createTemplate('member_benefits', '会员权益', 'info', '展示会员等级、有效期和当前可用权益。');
  memberBenefits.fields = [
    makeField('member_name', '会员名称', 'text', '张女士', '会员姓名。'),
    makeField('level', '会员等级', 'tag', '黄金会员', '当前会员等级。', { defaultValue: '普通会员', tagColor: '#d99416' }),
    makeField('expire_at', '有效期至', 'text', '2027-09-16', '会员有效期。'),
    makeField('points', '可用积分', 'text', '2,680', '当前可用积分。', { defaultValue: '0' }),
    makeField('benefit_badge', '当前权益', 'tag', '', '', { source: 'fixed', fixedValue: '专属客服,免运费', tagColor: '#6c63d9', tagPreview: 'multiple' })
  ];
  memberBenefits.actions = [makeAction('查看全部权益', '查看我的全部会员权益')];

  const orderDetail = createTemplate('order_detail', '订单详情', 'info', '展示订单基本信息、金额和物流状态。');
  orderDetail.fields = [
    makeField('order_no', '订单编号', 'text', 'DD202609160001', '订单唯一编号。'),
    makeField('status', '订单状态', 'tag', '待发货', '订单当前状态。', { defaultValue: '待付款', tagColor: '#e99a2c' }),
    makeField('amount', '订单金额', 'text', '¥598.00', '订单总金额。'),
    makeField('create_time', '下单时间', 'text', '2026-09-16 10:30', '订单创建时间。'),
    makeField('express', '物流公司', 'text', '顺丰速运', '承运物流公司。', { defaultValue: '待发货' })
  ];
  orderDetail.actions = [makeAction('查看物流', '帮我查一下 {{order_no}} 的物流')];

  const couponList = createTemplate('coupon_list', '优惠券列表', 'info', '展示可用的优惠券及使用条件。', 'list');
  couponList.fields = [
    makeField('name', '优惠券名称', 'text', '新人专享券', '优惠券名称。'),
    makeField('amount', '优惠金额', 'text', '¥50', '优惠金额或折扣。'),
    makeField('condition', '使用条件', 'text', '满 200 可用', '优惠券使用门槛。'),
    makeField('expire_at', '有效期至', 'text', '2026-12-31', '优惠券过期时间。', { tagColor: '#23a66f' })
  ];
  couponList.actions = [makeAction('立即使用', '我要使用 {{name}}')];

  const articleList = createTemplate('article_list', '知识文章列表', 'info', '展示多篇知识库文章及摘要。', 'list');
  articleList.fields = [
    makeField('title', '文章标题', 'text', '如何重置登录密码', '文章标题。'),
    makeField('category', '分类', 'tag', '账号安全', '文章所属分类。', { tagColor: '#6c63d9' }),
    makeField('summary', '内容摘要', 'text', '通过邮箱验证即可快速重置密码', '文章内容摘要。'),
    makeField('view_count', '阅读量', 'text', '2,345', '文章阅读次数。')
  ];
  articleList.actions = [makeAction('查看全文', '帮我打开 {{title}}')];

  const servicePackage = createTemplate('service_package', '服务套餐', 'product', '展示服务套餐内容、价格和购买入口。');
  servicePackage.fields = [
    makeField('name', '套餐名称', 'text', '企业旗舰版', '套餐名称。'),
    makeField('imageUrl', '套餐图片', 'image', productImages[3], '套餐宣传图地址。'),
    makeField('price', '套餐价格', 'text', '¥2,999/年', '套餐年付价格。'),
    makeField('features', '包含权益', 'tag', '无限坐席,7x24 支持', '套餐包含的核心权益。', { tagColor: '#23a66f', tagPreview: 'multiple' }),
    makeField('badge', '标签', 'tag', '', '', { source: 'fixed', fixedValue: '热销', tagColor: '#e34f5f' })
  ];
  servicePackage.actions = [makeAction('立即开通', '我要开通 {{name}}')];

  const examples = [ticketDetail, ticketList, planConfirm, refund, productRecommend, productDetail,
    memberBenefits, storeRecommend, orderDetail, couponList, articleList, servicePackage];

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
  let newFieldType = 'text';
  let newFieldSource = 'field';

  function loadTemplates() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.every(item => item.id && item.archetype && Array.isArray(item.fields))) {
        const savedTemplates = saved.map(template => ({
          ...template,
          fields: template.fields.map(field => {
            if (template.archetype === 'product' && field.type === 'image' && (!field.sample || /example\.com/.test(field.sample))) {
              return { ...field, sample: productImages[0] };
            }
            if (field.type === 'tag' && !field.tagColor) {
              const values = String(field.sample || '').split(/[,，]/).filter(Boolean);
            return { ...field, source: field.source || 'field', defaultValue: field.defaultValue || '', fixedValue: field.fixedValue || '', tagColor: field.rules?.[0]?.color || '#3569ff', tagPreview: values.length > 1 ? 'multiple' : 'single' };
            }
            return { ...field, source: field.source || 'field', defaultValue: field.defaultValue || '', fixedValue: field.fixedValue || '' };
          })
        }));
        const savedIds = new Set(savedTemplates.map(t => t.id));
        const missing = examples.filter(t => !savedIds.has(t.id));
        if (missing.length) return [...clone(missing), ...savedTemplates];
        return savedTemplates;
      }
    } catch {}
    return clone(examples);
  }

  function persist() { localStorage.setItem(storageKey, JSON.stringify(templates)); }
  function toast(message) { toastNode.textContent = message; toastNode.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastNode.classList.remove('show'), 2400); }

  function templateType(template) { return template.archetype === 'product' ? '商品卡片' : '信息卡片'; }

  function previewValue(field, template, index = 0) {
    if ((field.source || 'field') === 'fixed') return field.fixedValue || '';
    if (template.archetype === 'product' && template.mode === 'list') {
      if (field.type === 'image') {
        const imageOffset = template.id === 'store_recommend' ? 3 : 0;
        return productImages[(imageOffset + index) % productImages.length];
      }
      if (productSamples[index]?.[field.key]) return productSamples[index][field.key];
    }
    return field.sample || field.defaultValue || '';
  }

  function renderCard(template, index = 0, mini = false) {
    const fields = template.fields.filter(field => field.enabled);
    const image = template.archetype === 'product' ? fields.find(field => field.type === 'image') : null;
    const title = fields.find(field => field.type === 'text');
    const bodyFields = fields.filter(field => field !== title && field !== image);
    const body = (mini ? bodyFields.slice(0, 4) : bodyFields).map(field => {
      let sample = previewValue(field, template, index) || '暂无信息';
      if (index && /编号|单号/.test(field.label)) sample = `${sample}-${index + 1}`;
      if (field.type === 'tag') {
        let tagValues = Array.isArray(sample) ? sample : String(sample).split(/[,，]/);
        tagValues = tagValues.map(value => String(value).trim()).filter(Boolean);
        if (field.tagPreview !== 'multiple') tagValues = tagValues.slice(0, 1);
        sample = tagValues.map(value => {
          const tone = color(field.tagColor || field.rules?.[0]?.color || '#3569ff');
          return `<span class="tag-value" style="color:${tone};background:${tone}18">${esc(value)}</span>`;
        }).join(' ');
      } else if (field.type === 'link') {
        const href = safeUrl(sample);
        sample = `<a class="card-link" href="${esc(href || '#')}" ${href ? 'target="_blank" rel="noopener noreferrer"' : ''}>${esc(field.linkText || '查看链接')}</a>`;
      } else sample = esc(sample);
      return `<div class="data-row"><span class="label">${esc(field.label)}</span><span class="value">${sample}</span></div>`;
    }).join('');
    const imageUrl = image && safeUrl(previewValue(image, template, index) || productImages[0]);
    const titleValue = title ? previewValue(title, template, index) : template.name;
    const actions = template.actions.slice(0, 2).map(action => {
      const background = color(action.background);
      const textColor = color(action.textColor);
      const borderColor = background.toLowerCase() === '#ffffff' ? textColor : background;
      return `<button type="button" data-preview-action="${esc(action.id)}" style="background:${background};color:${textColor};border-color:${borderColor}">${esc(action.label || '按钮')}</button>`;
    }).join('');
    return `<article class="message-card ${template.archetype === 'product' ? 'product-card' : ''}">
      ${image ? `<div class="card-image">${imageUrl ? `<img src="${esc(imageUrl)}" alt="${esc(image.label)}">` : '<span>▧</span>'}</div>` : ''}
      <div class="card-main"><div class="card-title-row"><h3>${esc(titleValue || '卡片标题')}</h3></div>${body || '<p>添加字段后在这里预览。</p>'}</div>
      ${actions ? `<div class="card-actions ${template.actions.length === 1 ? 'one' : ''}">${actions}</div>` : ''}
    </article>`;
  }

  function renderPreview(template, mini = false) {
    const count = template.mode === 'list' ? Math.min(Number(template.max) || 3, mini ? 1 : 3) : 1;
    const cards = Array.from({ length: count }, (_, index) => renderCard(template, index, mini)).join('');
    return `<div class="card-list ${template.mode === 'list' && template.archetype === 'product' ? 'horizontal' : ''}">${cards}</div>${template.mode === 'list' && !mini ? (template.archetype === 'product' ? '<div class="carousel-controls"><button type="button" data-carousel-dir="-1" aria-label="上一个商品">‹</button><span>左右查看商品</span><button type="button" data-carousel-dir="1" aria-label="下一个商品">›</button></div>' : `<div class="more">最多展示 ${template.max} 条</div>`) : ''}`;
  }

  function renderHome() {
    const matches = templates.filter(template => (filter === 'all' || template.archetype === filter) && `${template.name} ${template.id} ${template.description}`.toLowerCase().includes(query.toLowerCase()));
    const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const visible = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    app.innerHTML = `<section class="page">
      <header class="page-head"><div><h1>卡片模板</h1><p>管理智能体使用的卡片模板</p></div><button class="primary" data-action="new">＋ 新建模板</button></header>
      <div class="toolbar"><nav class="tabs">${[['all','全部'],['info','信息卡片'],['product','商品卡片']].map(([key,label]) => `<button class="${filter === key ? 'active' : ''}" data-filter="${key}">${label}</button>`).join('')}</nav><label class="search"><input id="search" value="${esc(query)}" placeholder="搜索模板名称"></label><span class="result-count">${matches.length} 个模板</span></div>
      <div class="template-grid">${visible.map(template => `<article class="template-tile"><div class="tile-head"><div class="tile-title"><h3>${esc(template.name)}</h3><span class="kind ${template.archetype}">${templateType(template)}</span></div><p class="tile-desc">${esc(template.description)}</p></div><div class="tile-preview">${renderPreview(template, true)}</div><div class="tile-footer"><div class="tile-actions"><button class="link-btn" data-edit="${esc(template.id)}">编辑</button><button class="link-btn danger" data-delete-template="${esc(template.id)}">删除</button></div></div></article>`).join('') || '<div class="empty">没有找到模板，可以新建一个。</div>'}</div>
      ${pages > 1 ? `<div class="pagination"><button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, index) => `<button class="${page === index + 1 ? 'active' : ''}" data-page="${index + 1}">${index + 1}</button>`).join('')}<button data-page="${page + 1}" ${page === pages ? 'disabled' : ''}>›</button></div>` : ''}
    </section>${renderModal()}`;
  }

  function renderEditor() {
    app.innerHTML = `<section><header class="editor-top"><button class="ghost" data-action="back">←</button><span class="crumb">卡片模板 /</span><strong>${editingId ? '编辑模板' : '新建模板'}</strong><div class="editor-actions"><button data-action="back">取消</button><button class="primary" data-action="save">${editingId ? '保存修改' : '创建模板'}</button></div></header>
      <div class="editor-layout"><form class="editor-form" id="editor-form">
        <section class="panel"><div class="panel-head"><h2>基本信息</h2></div><div class="panel-body"><div class="form-grid compact-basic">
          <label class="form-item wide"><span class="required">名称</span><input data-root="name" value="${esc(draft.name)}" placeholder="给模板起一个容易识别的名称"></label>
          <label class="form-item wide"><span class="required">描述</span><textarea data-root="description" rows="2" placeholder="简单说明这个卡片用于展示什么内容">${esc(draft.description)}</textarea></label>
        </div></div></section>
        <section class="panel"><div class="panel-head"><h2>卡片样式</h2></div><div class="panel-body"><div class="type-summary compact"><span class="type-icon ${draft.archetype}">${draft.archetype === 'product' ? '▧' : '▤'}</span><strong>${templateType(draft)}</strong></div><div class="choice-row"><button type="button" class="choice ${draft.mode === 'single' ? 'active' : ''}" data-mode="single"><i></i><span>单张卡片</span></button><button type="button" class="choice ${draft.mode === 'list' ? 'active' : ''}" data-mode="list"><i></i><span>卡片列表</span></button></div>${draft.mode === 'list' ? `<label class="form-item max-count"><span>最大展示数量</span><input data-root="max" type="number" min="1" max="10" value="${esc(draft.max)}"></label>` : ''}</div></section>
        <section class="panel"><div class="panel-head row"><h2>展示字段</h2><button type="button" class="link-btn" data-action="add-field">＋ 添加字段</button></div><div class="fields-list">${draft.fields.map((field,index) => renderField(field,index)).join('') || '<div class="empty-section">暂无展示字段</div>'}</div></section>
        <section class="panel"><div class="panel-head row"><h2>操作按钮</h2><button type="button" class="link-btn" data-action="add-action" ${draft.actions.length >= 2 ? 'disabled' : ''}>＋ 添加按钮</button></div><div class="actions-list">${draft.actions.map((action,index) => renderAction(action,index)).join('') || '<div class="empty-section">暂无按钮</div>'}</div></section>
      </form><aside class="preview-pane"><div class="preview-head"><h2>实时预览</h2><span>● 自动更新</span></div><div class="preview-stage"><div id="preview-content">${renderPreview(draft)}</div><div id="preview-feedback" class="preview-feedback hidden"></div></div></aside></div>
    </section>${renderModal()}`;
  }

  function renderField(field, index) {
    const open = expandedField === field.id;
    const source = field.source || 'field';
    return `<div class="field-box" data-field-id="${esc(field.id)}"><div class="field-summary"><button type="button" class="drag" draggable="true" aria-label="拖动排序" title="按住拖动调整顺序">⠿</button><span class="index">${String(index + 1).padStart(2, '0')}</span><strong>${esc(field.label || '未命名字段')}</strong>${source === 'fixed' ? '<span class="source-chip">固定</span>' : ''}<span class="spacer"></span><button type="button" class="switch ${field.enabled ? 'on' : ''}" data-toggle-enabled="${esc(field.id)}" aria-label="${field.enabled ? '停用' : '启用'}字段"><i></i><span>${field.enabled ? '已启用' : '已停用'}</span></button><button type="button" data-toggle-field="${esc(field.id)}">${open ? '收起' : '配置'}</button><button type="button" class="danger" data-remove-field="${esc(field.id)}">删除</button></div>${open ? `<div class="field-editor"><div class="form-grid">
      <label class="form-item"><span class="required">显示名称</span><input data-field="label" value="${esc(field.label)}"></label><label class="form-item"><span>内容来源</span><select data-field="source"><option value="field" ${source === 'field' ? 'selected' : ''}>接口字段</option><option value="fixed" ${source === 'fixed' ? 'selected' : ''}>固定内容</option></select></label>
      <label class="form-item"><span>显示类型</span><select data-field="type">${fieldTypeOptions(field.type)}</select></label><div></div>
      ${source === 'field' ? `<label class="form-item"><span class="required">数据字段</span><input data-field="key" value="${esc(field.key)}" placeholder="例如 status"></label><label class="form-item"><span>默认值</span><input data-field="defaultValue" value="${esc(field.defaultValue || '')}" placeholder="字段为空时显示"></label><label class="form-item wide"><span class="required">字段说明</span><textarea class="description-area" data-field="description" rows="2" placeholder="说明这个字段表示什么">${esc(field.description)}</textarea></label>${fieldTypeEditor(field)}` : fixedFieldEditor(field)}
    </div></div>` : ''}</div>`;
  }

  function fieldTypeOptions(selected) {
    return Object.entries(fieldTypes).filter(([key]) => draft.archetype === 'product' || key !== 'image').map(([key,label]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${label}</option>`).join('');
  }

  function fieldTypeEditor(field) {
    if (field.type === 'tag') return `<div class="form-item wide tag-source"><span>读取字段</span><code>${esc(field.key || '未设置')}</code><small>自动识别单个值或数组</small></div><label class="form-item"><span>预览效果</span><select data-field="tagPreview"><option value="single" ${field.tagPreview !== 'multiple' ? 'selected' : ''}>单个标签</option><option value="multiple" ${field.tagPreview === 'multiple' ? 'selected' : ''}>多个标签</option></select></label><label class="form-item"><span>标签颜色</span><span class="color-input"><input type="color" data-field="tagColor" value="${color(field.tagColor || field.rules?.[0]?.color)}"><input type="text" data-field="tagColor" value="${color(field.tagColor || field.rules?.[0]?.color)}"></span></label><label class="form-item wide"><span>预览内容</span><input data-field="sample" value="${esc(field.sample)}" placeholder="${field.tagPreview === 'multiple' ? '例如 新品,热销' : '例如 处理中'}"></label>`;
    if (field.type === 'image') return `<label class="form-item wide"><span>图片链接</span><input data-field="sample" value="${esc(field.sample)}" placeholder="https://example.com/product.jpg"></label><label class="form-item"><span>图片比例</span><select data-field="ratio"><option ${field.ratio === '1/1' ? 'selected' : ''}>1/1</option><option ${field.ratio !== '1/1' ? 'selected' : ''}>16/9</option></select></label>`;
    if (field.type === 'link') return `<label class="form-item"><span>链接文字</span><input data-field="linkText" value="${esc(field.linkText || '查看详情')}"></label><label class="form-item"><span>链接地址</span><input data-field="sample" value="${esc(field.sample)}" placeholder="https://example.com/detail"></label>`;
    return `<label class="form-item wide"><span>示例文本</span><textarea data-field="sample" rows="2" placeholder="用于右侧实时预览">${esc(field.sample)}</textarea></label><label class="form-item"><span>最多显示行数</span><select data-field="lines">${[1,2,3,5].map(line => `<option value="${line}" ${Number(field.lines || 2) === line ? 'selected' : ''}>${line} 行</option>`).join('')}</select></label>`;
  }

  function fixedFieldEditor(field) {
    if (field.type === 'tag') return `<label class="form-item wide"><span class="required">固定标签</span><input data-field="fixedValue" value="${esc(field.fixedValue || '')}" placeholder="多个标签用逗号分隔"></label><label class="form-item"><span>展示方式</span><select data-field="tagPreview"><option value="single" ${field.tagPreview !== 'multiple' ? 'selected' : ''}>单个标签</option><option value="multiple" ${field.tagPreview === 'multiple' ? 'selected' : ''}>多个标签</option></select></label><label class="form-item"><span>标签颜色</span><span class="color-input"><input type="color" data-field="tagColor" value="${color(field.tagColor)}"><input type="text" data-field="tagColor" value="${color(field.tagColor)}"></span></label>`;
    if (field.type === 'image') return `<label class="form-item wide"><span class="required">固定图片链接</span><input data-field="fixedValue" value="${esc(field.fixedValue || '')}" placeholder="https://example.com/image.jpg"></label>`;
    if (field.type === 'link') return `<label class="form-item"><span>链接文字</span><input data-field="linkText" value="${esc(field.linkText || '查看详情')}"></label><label class="form-item"><span class="required">固定链接</span><input data-field="fixedValue" value="${esc(field.fixedValue || '')}" placeholder="https://example.com/detail"></label>`;
    return `<label class="form-item wide"><span class="required">固定内容</span><textarea data-field="fixedValue" rows="2" placeholder="每次都显示这段内容">${esc(field.fixedValue || '')}</textarea></label>`;
  }

  function renderAction(action, index) {
    const open = expandedAction === action.id;
    return `<div class="field-box" data-action-id="${esc(action.id)}"><div class="field-summary"><span class="index">${String(index + 1).padStart(2, '0')}</span><strong>${esc(action.label || '未命名按钮')}</strong><span class="spacer"></span><button type="button" data-toggle-action="${esc(action.id)}">${open ? '收起' : '配置'}</button><button type="button" class="danger" data-remove-action="${esc(action.id)}">删除</button></div>${open ? `<div class="field-editor"><div class="form-grid"><label class="form-item"><span class="required">按钮文字</span><input data-button="label" value="${esc(action.label)}"></label><label class="form-item"><span>点击动作</span><select data-button="action"><option value="speech" ${action.action === 'speech' ? 'selected' : ''}>发送话术</option><option value="link" ${action.action === 'link' ? 'selected' : ''}>打开链接</option></select></label><label class="form-item wide"><span class="required">${action.action === 'link' ? '跳转链接' : '输出话术'}</span><textarea data-button="target" rows="2" placeholder="${action.action === 'link' ? 'https://example.com/detail' : '帮我查看详情'}">${esc(action.target)}</textarea></label><label class="form-item"><span>插入字段</span><select data-insert><option value="">选择字段</option>${draft.fields.filter(field => field.key).map(field => `<option value="${esc(field.key)}">${esc(field.label)}</option>`).join('')}</select></label><div></div><div class="button-colors wide"><label class="form-item"><span>背景颜色</span><span class="color-input"><input type="color" data-button="background" value="${color(action.background)}"><input type="text" data-button="background" value="${color(action.background)}"></span></label><label class="form-item"><span>文字颜色</span><span class="color-input"><input type="color" data-button="textColor" value="${color(action.textColor)}"><input type="text" data-button="textColor" value="${color(action.textColor)}"></span></label></div><div class="button-color-preview wide" style="background:${color(action.background)};color:${color(action.textColor)}">${esc(action.label || '按钮效果')}</div></div></div>` : ''}</div>`;
  }

  function renderModal() {
    if (!modal) return '';
    if (modal === 'starter') return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>选择卡片类型</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><div class="starter-grid"><button class="starter" data-starter="info"><span class="type-icon">▤</span><h3>信息卡片</h3><p>让业务信息规整、醒目，快速看到状态和关键字段。</p><ul><li>支持单张或上下列表</li><li>适合工单、订单、套餐、会员</li><li>可配置文本、标签、链接和按钮</li></ul></button><button class="starter" data-starter="product"><span class="type-icon product">▧</span><h3>商品卡片</h3><p>图片主导的推荐卡片，突出价格、卖点和行动入口。</p><ul><li>支持单张或左右滑动列表</li><li>适合商品、门店、内容推荐</li><li>默认包含图片字段</li></ul></button></div></div></section></div>`;
    if (modal === 'addField') return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>添加展示字段</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><div class="form-grid"><label class="form-item"><span class="required">显示名称</span><input id="new-label" placeholder="例如 退款状态"></label><label class="form-item"><span>内容来源</span><select id="new-source"><option value="field" ${newFieldSource === 'field' ? 'selected' : ''}>接口字段</option><option value="fixed" ${newFieldSource === 'fixed' ? 'selected' : ''}>固定内容</option></select></label><label class="form-item"><span>显示类型</span><select id="new-type">${Object.entries(fieldTypes).filter(([key]) => draft.archetype === 'product' || key !== 'image').map(([key,label]) => `<option value="${key}" ${newFieldType === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div></div><div id="new-source-specific" class="form-item wide">${newSourceSpecific()}</div><div id="new-type-specific" class="form-item wide">${newFieldSpecific()}</div></div></div><footer class="modal-actions"><button data-close-modal>取消</button><button class="primary" data-confirm-field>添加字段</button></footer></section></div>`;
    const template = templates.find(item => item.id === deleteId);
    return `<div class="modal-backdrop"><section class="modal"><header class="modal-head"><h2>删除模板</h2><button class="ghost" data-close-modal>×</button></header><div class="modal-body"><p class="confirm-copy">确定删除“${esc(template?.name)}”吗？删除后不可恢复。</p></div><footer class="modal-actions"><button data-close-modal>取消</button><button class="primary" data-confirm-delete>确认删除</button></footer></section></div>`;
  }

  function newFieldSpecific() {
    const fixed = newFieldSource === 'fixed';
    if (newFieldType === 'tag') return `<span>${fixed ? '固定标签' : '预览标签'}</span><input id="new-sample" placeholder="多个标签用逗号分隔，例如 新品,热销">`;
    if (newFieldType === 'image') return `<span>${fixed ? '固定图片链接' : '预览图片链接'}</span><input id="new-sample" placeholder="https://example.com/product.jpg">`;
    if (newFieldType === 'link') return `<div class="form-grid"><label class="form-item"><span>链接文字</span><input id="new-link-text" value="查看详情"></label><label class="form-item"><span>${fixed ? '固定链接' : '预览链接'}</span><input id="new-sample" placeholder="https://example.com/detail"></label></div>`;
    return `<span>${fixed ? '固定内容' : '预览内容'}</span><textarea id="new-sample" rows="2" placeholder="${fixed ? '每次都显示这段内容' : '用于右侧实时预览'}"></textarea>`;
  }

  function newSourceSpecific() {
    if (newFieldSource === 'fixed') return '';
    return '<div class="form-grid"><label class="form-item"><span class="required">数据字段</span><input id="new-key" placeholder="例如 status"></label><label class="form-item"><span>默认值</span><input id="new-default" placeholder="字段为空时显示"></label><label class="form-item wide"><span class="required">字段说明</span><textarea id="new-description" rows="2" placeholder="说明这个字段表示什么"></textarea></label></div>';
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
      if (target.dataset.field === 'type' || target.dataset.field === 'source') { field.rules ||= []; renderEditor(); } else updatePreview();
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
    if (target.id === 'new-type') {
      newFieldType = target.value;
      const specific = document.querySelector('#new-type-specific');
      if (specific) specific.innerHTML = newFieldSpecific();
      return;
    }
    if (target.id === 'new-source') {
      newFieldSource = target.value;
      const sourceSpecific = document.querySelector('#new-source-specific');
      const typeSpecific = document.querySelector('#new-type-specific');
      if (sourceSpecific) sourceSpecific.innerHTML = newSourceSpecific();
      if (typeSpecific) typeSpecific.innerHTML = newFieldSpecific();
      return;
    }
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
    if (target.dataset.deleteTemplate) { deleteId = target.dataset.deleteTemplate; modal = 'delete'; renderHome(); return; }
    if (target.dataset.confirmDelete !== undefined) { templates = templates.filter(item => item.id !== deleteId); persist(); modal = null; renderHome(); toast('模板已删除'); return; }
    if (target.dataset.action === 'back') { view = 'home'; draft = null; modal = null; renderHome(); return; }
    if (target.dataset.action === 'save') { saveDraft(); return; }
    if (target.dataset.mode) { draft.mode = target.dataset.mode; renderEditor(); return; }
    if (target.dataset.action === 'add-field') { newFieldType = 'text'; newFieldSource = 'field'; modal = 'addField'; renderEditor(); return; }
    if (target.dataset.confirmField !== undefined) { addFieldFromModal(); return; }
    if (target.dataset.toggleField) { expandedField = expandedField === target.dataset.toggleField ? null : target.dataset.toggleField; renderEditor(); return; }
    if (target.dataset.removeField) { draft.fields = draft.fields.filter(field => field.id !== target.dataset.removeField); renderEditor(); return; }
    if (target.dataset.toggleEnabled) { const field = draft.fields.find(item => item.id === target.dataset.toggleEnabled); field.enabled = !field.enabled; renderEditor(); return; }
    if (target.dataset.addRule !== undefined) { const field = fieldByNode(target); field.rules.push({ value: '', label: '', color: '#3569ff' }); renderEditor(); return; }
    if (target.dataset.removeRule !== undefined) { const field = fieldByNode(target); field.rules.splice(Number(target.dataset.removeRule), 1); renderEditor(); return; }
    if (target.dataset.action === 'add-action') { if (draft.actions.length >= 2) return; const action = makeAction(`按钮 ${draft.actions.length + 1}`, ''); draft.actions.push(action); expandedAction = action.id; renderEditor(); return; }
    if (target.dataset.toggleAction) { expandedAction = expandedAction === target.dataset.toggleAction ? null : target.dataset.toggleAction; renderEditor(); return; }
    if (target.dataset.removeAction) { draft.actions = draft.actions.filter(action => action.id !== target.dataset.removeAction); renderEditor(); return; }
    if (target.dataset.carouselDir) {
      const list = document.querySelector('#preview-content .card-list.horizontal');
      if (list) list.scrollBy({ left: Number(target.dataset.carouselDir) * list.clientWidth, behavior: 'smooth' });
      return;
    }
    if (target.dataset.previewAction) { previewAction(target.dataset.previewAction); }
  });

  app.addEventListener('input', event => { if (event.target.id === 'search') { query = event.target.value; page = 1; renderHome(); document.querySelector('#search')?.focus(); } });

  app.addEventListener('dragstart', event => { const handle = event.target.closest('.drag'); const box = handle?.closest('[data-field-id]'); if (!box) { event.preventDefault(); return; } box.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', box.dataset.fieldId); });
  app.addEventListener('dragend', () => document.querySelectorAll('.field-box').forEach(box => box.classList.remove('dragging','drop-before','drop-after')));
  app.addEventListener('dragover', event => { const box = event.target.closest('[data-field-id]'); if (!box) return; event.preventDefault(); document.querySelectorAll('.field-box').forEach(item => item.classList.remove('drop-before','drop-after')); const after = event.clientY > box.getBoundingClientRect().top + box.getBoundingClientRect().height / 2; box.classList.add(after ? 'drop-after' : 'drop-before'); });
  app.addEventListener('drop', event => { const box = event.target.closest('[data-field-id]'); if (!box) return; event.preventDefault(); const source = draft.fields.findIndex(field => field.id === event.dataTransfer.getData('text/plain')); let destination = draft.fields.findIndex(field => field.id === box.dataset.fieldId); const after = box.classList.contains('drop-after'); if (source >= 0 && destination >= 0 && source !== destination) { const [field] = draft.fields.splice(source, 1); if (source < destination) destination--; draft.fields.splice(destination + (after ? 1 : 0), 0, field); renderEditor(); } });

  function addFieldFromModal() {
    const label = document.querySelector('#new-label')?.value.trim();
    const key = document.querySelector('#new-key')?.value.trim() || '';
    const description = document.querySelector('#new-description')?.value.trim() || '';
    const type = document.querySelector('#new-type')?.value;
    const sample = document.querySelector('#new-sample')?.value;
    if (!label || (newFieldSource === 'field' && (!key || !description)) || (newFieldSource === 'fixed' && !sample)) { toast('请完整填写当前内容'); return; }
    if (newFieldSource === 'field' && !/^[a-zA-Z][\w.]*$/.test(key)) { toast('数据字段需以字母开头，仅支持字母、数字、下划线和点'); return; }
    const field = makeField(key, label, type, newFieldSource === 'field' ? sample : '', description, { source: newFieldSource, defaultValue: document.querySelector('#new-default')?.value || '', fixedValue: newFieldSource === 'fixed' ? sample : '', linkText: document.querySelector('#new-link-text')?.value || '' });
    if (type === 'tag') {
      field.tagColor = '#3569ff';
      field.tagPreview = String(sample || '').split(/[,，]/).filter(Boolean).length > 1 ? 'multiple' : 'single';
    }
    draft.fields.push(field); expandedField = field.id; modal = null; renderEditor();
  }

  function validate() {
    draft.name = draft.name.trim(); draft.description = draft.description.trim();
    if (!draft.id) draft.id = `custom_${Date.now().toString(36)}`;
    if (templates.some(item => item.id === draft.id && item.id !== editingId)) return '模板名称已存在';
    if (!draft.name) return '请填写名称';
    if (!draft.description) return '请填写模板描述';
    if (!draft.fields.length) return '请至少添加一个展示字段';
    if (draft.archetype === 'info' && draft.fields.some(field => field.type === 'image')) return '信息卡片不支持图片字段';
    if (draft.fields.some(field => !field.label.trim())) return '请完整填写字段名称';
    if (draft.fields.some(field => (field.source || 'field') === 'field' && (!field.key.trim() || !field.description.trim()))) return '请完整填写接口字段和字段说明';
    if (draft.fields.some(field => field.source === 'fixed' && !String(field.fixedValue || '').trim())) return '请填写固定内容';
    const boundKeys = draft.fields.filter(field => (field.source || 'field') === 'field').map(field => field.key);
    if (new Set(boundKeys).size !== boundKeys.length) return '数据字段不能重复';
    if (draft.actions.length > 2) return '操作按钮最多两个';
    if (draft.actions.some(action => !action.label.trim() || !action.target.trim())) return '请完整配置按钮文字和动作内容';
    if (draft.actions.some(action => action.action === 'link' && !/^https?:\/\//.test(action.target.replace(/\{\{[^}]+\}\}/g, 'value')))) return '跳转链接必须使用完整的 http 或 https 地址';
    return '';
  }

  function saveDraft() {
    const error = validate(); if (error) { toast(error); return; }
    templates = templates.filter(item => item.id !== editingId); templates.unshift(clone(draft)); persist(); editingId = draft.id; view = 'home'; renderHome(); toast('模板已保存');
  }

  function previewAction(id) {
    const action = draft.actions.find(item => item.id === id); const node = document.querySelector('#preview-feedback'); if (!action || !node) return;
    const resolved = action.target.replace(/\{\{([^}]+)\}\}/g, (_, key) => { const field = draft.fields.find(item => item.key === key); return field ? previewValue(field, draft) : `{{${key}}}`; });
    node.textContent = action.action === 'link' ? `将打开：${resolved}` : `用户发送：${resolved}`; node.classList.remove('hidden');
  }

  render();
})();
