import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('advanced agent configuration prototype', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('renders the current advanced-agent workspace and configuration modules', () => {
    render(<App />);

    expect(screen.getByText('Udesk Agent')).toBeInTheDocument();
    expect(screen.getByText('new高级智能体')).toBeInTheDocument();
    expect(screen.getAllByText('Doubao-Seed-2.0-pro').length).toBeGreaterThan(0);

    for (const section of ['提示词', '思考模式', '回复体验', '对话管理', '主动服务', '多模态输入', '变量', '技能', '工具', '知识库', '长期记忆', '上下文压缩', '会话变量', '反思机制', '人工审核', '护栏配置']) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });

  it('configures channel-native capabilities, behavior rules and context variables', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '渠道' }));
    expect(screen.getByRole('heading', { name: 'WhatsApp' })).toBeInTheDocument();
    expect(screen.getByText('Reply Button')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '降级' }));
    expect(screen.getByText('已降级为文本消息')).toBeInTheDocument();
    expect(screen.getAllByText('编号选项或模板文本')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '行为规则' }));
    expect(screen.getByText('WhatsApp 首次会话隐私告知')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '启用WhatsApp 首次会话隐私告知' }));
    expect(screen.getByRole('checkbox', { name: '启用WhatsApp 首次会话隐私告知' })).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: '上下文变量' }));
    expect(screen.getByText('channel.capabilities')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '启用channel.capabilities' })).toBeChecked();
  });

  it('makes channel setup, fallback, preview and rule actions usable', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '渠道' }));

    await user.click(screen.getByRole('button', { name: '渠道设置' }));
    await user.clear(screen.getByLabelText('渠道设置账号'));
    await user.type(screen.getByLabelText('渠道设置账号'), '+65 9000 0000');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getAllByText('+65 9000 0000')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: '编辑' }));
    await user.selectOptions(screen.getByLabelText('降级格式'), '仅纯文本');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('仅纯文本')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '发送测试消息' }));
    await user.click(screen.getByRole('button', { name: '行为规则' }));
    await user.click(screen.getByRole('button', { name: '新建规则' }));
    await user.type(screen.getByLabelText('规则名称'), '短消息规则');
    await user.type(screen.getByLabelText('规则生效条件'), '渠道 = WhatsApp');
    await user.type(screen.getByLabelText('规则执行动作'), '限制回复长度');
    await user.click(screen.getByRole('button', { name: '创建' }));
    expect(screen.getByText('短消息规则')).toBeInTheDocument();
  });

  it('manages cross-channel identity, temporal memory and a conflict decision', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '长期记忆' }));
    expect(screen.getByRole('heading', { name: '长期记忆' })).toBeInTheDocument();
    expect(screen.getByText('退款审核中 · RF-20260718')).toBeInTheDocument();
    expect(screen.getByText('待解决冲突')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('主标识'), 'CRM external_id');
    expect(screen.getByLabelText('主标识')).toHaveValue('CRM external_id');
    await user.click(screen.getByRole('button', { name: '身份映射' }));
    expect(screen.getByRole('dialog', { name: '身份映射' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.click(screen.getByRole('button', { name: '偏好' }));
    expect(screen.getByText('中文')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '人工添加' }));
    await user.selectOptions(screen.getByLabelText('记忆类型'), '偏好');
    await user.type(screen.getByLabelText('记忆 Key'), 'vip_level');
    await user.type(screen.getByLabelText('记忆值'), 'gold');
    await user.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('gold')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '采用推荐结果' }));
    expect(screen.getByText('冲突已解决')).toBeInTheDocument();
  });

  it('separates realtime monitoring from historical reports', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '监控' }));
    expect(screen.getByRole('heading', { name: '监控' })).toBeInTheDocument();
    expect(screen.getByText('WhatsApp 模板发送失败率升高')).toBeInTheDocument();
    expect(screen.getByText('Agent 运行链路')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '报表' }));
    expect(screen.getByRole('heading', { name: '报表' })).toBeInTheDocument();
    expect(screen.getByText('单解决成本')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '版本对比' }));
    expect(screen.getByText('版本对比趋势')).toBeInTheDocument();
  });

  it('delivers a long answer as several semantic customer messages', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '客户视图' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '详细查询一下订单配送进度');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(await screen.findByText('我查到了，您的订单目前正在配送中。', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText(/物流信息显示包裹今天上午已经到达本地配送站/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText(/如果今晚仍未收到/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('sends one natural wait message before a long-running result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '客户视图' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '帮我生成报表');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(await screen.findByText('稍等我一下，我正在为您处理。', {}, { timeout: 1800 })).toBeInTheDocument();
    expect(await screen.findByText(/报表已经生成完成/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('cancels an unfinished run and replans when the user adds information', async () => {
    const user = userEvent.setup();
    render(<App />);
    const composer = screen.getByPlaceholderText('和机器人聊一聊吧');
    await user.type(composer, '帮我生成报表');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    await user.type(composer, '只看本月客服数据');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(screen.getByText('收到补充消息，已停止并重新规划')).toBeInTheDocument();
    expect(screen.getByText('已合并上一条消息：帮我生成报表')).toBeInTheDocument();
    expect(await screen.findByText(/报表已经生成完成/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('uses the configured waiting phrase for a long-running task', async () => {
    const user = userEvent.setup();
    render(<App />);
    const service = screen.getByRole('heading', { name: '主动服务' }).closest('section')!;
    await user.clear(within(service).getByLabelText('长任务等待话术'));
    await user.type(within(service).getByLabelText('长任务等待话术'), '我正在为您核对，请稍等。');
    await user.click(screen.getByRole('button', { name: '客户视图' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '帮我生成报表');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(await screen.findByText('我正在为您核对，请稍等。', {}, { timeout: 1800 })).toBeInTheDocument();
  });

  it('transcribes recorded speech into editable text before sending with an image', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const imageInput = container.querySelector('input[accept^="image/"]') as HTMLInputElement;

    await user.upload(imageInput, new File(['image'], 'payment-error.png', { type: 'image/png' }));
    await user.click(screen.getByRole('button', { name: '开始录音' }));
    expect(screen.getByRole('dialog', { name: '语音录制' })).toBeInTheDocument();
    expect(screen.getByText('录音中')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '完成录音' }));

    expect(screen.getByText('payment-error.png')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('我想查询一下昨天购买的订单什么时候发货。')).toBeInTheDocument();
    expect(screen.queryByText('语音已转为文字，可修改后发送')).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), ' 请结合截图判断问题');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(screen.getByRole('status')).toHaveTextContent('正在读取图片');
    expect(await screen.findByText('已识别 1 张图片', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/从截图看，这是订单支付页/)).toBeInTheDocument();
  });

  it('disables media upload entry points with multimodal configuration switches', async () => {
    const user = userEvent.setup();
    render(<App />);
    const section = screen.getByRole('heading', { name: '多模态输入' }).closest('section')!;

    await user.click(within(section).getByRole('checkbox', { name: '接收并识别图片' }));
    await user.click(within(section).getByRole('checkbox', { name: '接收并识别语音和音频' }));

    expect(screen.getByRole('button', { name: '上传图片' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '开始录音' })).toBeDisabled();
    expect(screen.queryByLabelText('图片理解模型')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('单次最大图片数')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('最大音频时长')).not.toBeInTheDocument();
  });

  it('keeps Agent execution compact in the conversation and exposes the log entry point', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '帮我查一下订单什么时候送到');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(screen.getByRole('status')).toHaveTextContent('理解用户请求');
    expect(document.querySelectorAll('.compact-runtime-status')).toHaveLength(1);
    expect(document.querySelector('.runtime-timeline')).not.toBeInTheDocument();
    expect(await screen.findByText('您的订单目前正在配送中，预计今天 18:00 前送达。', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已处理 1.4s');
    expect(screen.getByRole('button', { name: 'Agent 日志' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制回复' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新运行' })).toBeInTheDocument();
  });

  it('switches customer preview between humanized whole-message and streaming modes', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: '客户视图' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '查询订单配送状态');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    expect(await screen.findByLabelText('对方正在输入', {}, { timeout: 1800 })).toBeInTheDocument();
    expect(screen.queryByText('调用订单中心')).not.toBeInTheDocument();
    expect(await screen.findByText('您的订单目前正在配送中，预计今天 18:00 前送达。', {}, { timeout: 4000 })).toBeInTheDocument();

    const responseSection = screen.getByRole('heading', { name: '回复体验' }).closest('section')!;
    await user.click(within(responseSection).getByRole('checkbox', { name: '模拟真人回复节奏' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '再查询一次订单状态');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    expect(container.querySelector('.streaming-message')).toBeInTheDocument();
  });

  it('restores legacy saved configurations without response experience fields', async () => {
    const user = userEvent.setup();
    localStorage.setItem('uagent-advanced-config-saved-v1', JSON.stringify({ prompt: '旧版本保存的提示词', thinkingMode: 'fast' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: '恢复已保存配置' }));

    expect(screen.getByDisplayValue('旧版本保存的提示词')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '模拟真人回复节奏' })).toBeChecked();
    expect(screen.getByLabelText('输入状态节奏')).toHaveValue('natural');
  });

  it('resizes the preview panel with the keyboard-accessible divider', async () => {
    const user = userEvent.setup();
    render(<App />);

    const divider = screen.getByRole('separator', { name: '调整配置区和预览区宽度' });
    expect(divider).toHaveAttribute('aria-valuenow', '440');
    divider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(divider).toHaveAttribute('aria-valuenow', '460');
    await user.keyboard('{ArrowRight}');
    expect(divider).toHaveAttribute('aria-valuenow', '440');
  });

  it('adds a third-party input rule with provider configuration', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '添加输入检测规则' }));
    const dialog = screen.getByRole('dialog', { name: '添加检测规则' });
    await user.type(within(dialog).getByLabelText('规则名称'), '腾讯云敏感内容审核');
    await user.selectOptions(within(dialog).getByLabelText('执行方式'), 'THIRD_PARTY');
    await user.selectOptions(within(dialog).getByLabelText('规则类型'), 'CONTENT_MODERATION');

    expect(within(dialog).getByLabelText('服务来源')).toBeVisible();
    expect(within(dialog).getByLabelText('凭证')).toBeVisible();
    expect(within(dialog).getByLabelText('超时时间')).toBeVisible();

    await user.selectOptions(within(dialog).getByLabelText('服务来源'), 'tencent-content-security');
    await user.click(within(dialog).getByRole('button', { name: '保存配置' }));

    expect(screen.getByText('腾讯云敏感内容审核')).toBeInTheDocument();
    expect(screen.getByText('腾讯云')).toBeInTheDocument();
  });

  it('edits an existing rule and updates the same row', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '编辑输入规则 阿里云内容审核' }));
    const dialog = screen.getByRole('dialog', { name: '编辑检测规则' });
    const nameInput = within(dialog).getByLabelText('规则名称');
    await user.clear(nameInput);
    await user.type(nameInput, '阿里云输入审核（生产）');
    await user.click(within(dialog).getByRole('button', { name: '保存配置' }));

    expect(screen.getByText('阿里云输入审核（生产）')).toBeInTheDocument();
    expect(screen.queryByText('阿里云内容审核')).not.toBeInTheDocument();
  });

  it('uses current rules in the preview and keeps the highest-risk decision', async () => {
    const user = userEvent.setup();
    render(<App />);

    const chatInput = screen.getByPlaceholderText('和机器人聊一聊吧');
    await user.type(chatInput, '给手机号 13800138000 的客户直接退款 200 元');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    expect(await screen.findByText(/这个操作需要您确认后才能继续/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText(/138\*{4}8000/)).toBeInTheDocument();
  });

  it('configures skills and keeps the selection in the workspace', async () => {
    const user = userEvent.setup();
    render(<App />);

    const skillSection = screen.getByRole('heading', { name: '技能' }).closest('section')!;
    await user.click(within(skillSection).getByRole('button', { name: '添加' }));
    const dialog = screen.getByRole('dialog', { name: '选择技能' });
    await user.click(within(dialog).getByText('客户意图识别'));
    await user.click(within(dialog).getByRole('button', { name: '确认' }));

    expect(within(skillSection).getAllByText('客户意图识别')).toHaveLength(2);
    expect(within(skillSection).getByText(/v1.3.0 · 自动更新/)).toBeInTheDocument();
  });

  it('opens model parameters and switches top-level workspace tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Doubao-Seed-2.0-pro/ }));
    expect(screen.getByRole('dialog', { name: '模型配置' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '日志' }));
    expect(screen.getByText('运行日志实时捕获系统操作轨迹，详细记载用户请求与 AI 反馈的交互过程。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '监控' }));
    expect(screen.getByText('运行中 Run')).toBeInTheDocument();
  });

  it('adds a configurable session variable field', async () => {
    const user = userEvent.setup();
    render(<App />);
    const section = screen.getByRole('heading', { name: '会话变量' }).closest('section')!;
    await user.click(within(section).getByLabelText('启用会话变量'));
    await user.click(within(section).getAllByRole('button', { name: '添加' })[0]);
    expect(within(section).getByText('字段 1')).toBeInTheDocument();
    expect(within(section).getByLabelText('变量名')).toBeInTheDocument();
  });

  it('opens the enhanced skill workspace and exercises version and validation flows', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/?view=skills');
    render(<App />);

    expect(screen.getByRole('heading', { name: '技能' })).toBeInTheDocument();
    await user.click(screen.getByText('客户资料更新').closest('button')!);
    expect(screen.getAllByText('SKILL.md')).toHaveLength(2);
    expect(screen.getByDisplayValue(/Customer Profile Update/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '版本记录' }));
    await user.click(screen.getAllByRole('button', { name: '恢复为草稿' })[1]);
    expect(screen.getByText(/restored/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '合规校验' }));
    await user.click(screen.getByRole('button', { name: '运行校验' }));
    expect(screen.getAllByText('通过')).toHaveLength(4);
  });

  it('creates an AI-generated skill draft with category and tags', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/?view=skills');
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建技能' }));
    const dialog = screen.getByRole('dialog', { name: '创建技能' });
    await user.click(within(dialog).getByRole('button', { name: /AI 创建/ }));
    await user.type(within(dialog).getByPlaceholderText('输入 Skills 显示名称'), '投诉升级处理');
    await user.type(within(dialog).getByPlaceholderText('说明技能解决的问题及使用边界'), '识别高风险投诉并升级人工处理。');
    await user.click(within(dialog).getByRole('button', { name: '风险操作' }));
    await user.type(within(dialog).getByPlaceholderText('描述场景、输入、输出、工具和风险边界'), '要求保留证据并记录升级原因。');
    await user.click(within(dialog).getByRole('button', { name: '生成技能' }));
    await user.click(within(dialog).getByRole('button', { name: '创建草稿' }));

    expect(screen.getByRole('heading', { name: '投诉升级处理' })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/要求保留证据并记录升级原因/)).toBeInTheDocument();
  });
});
