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

    for (const section of ['提示词', '思考模式', '复杂任务规划', '回复体验', '对话管理', '主动服务', '多模态输入', '变量', '技能', '工具', '知识库', '长期记忆', '上下文压缩', '会话变量', '反思机制', '人工审核', '护栏配置']) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
  });

  it('configures complex-task planning and persists the Planner Prompt', async () => {
    const user = userEvent.setup();
    render(<App />);
    const section = screen.getByRole('heading', { name: '复杂任务规划' }).closest('section')!;

    expect(within(section).getByRole('checkbox', { name: '启用复杂任务规划' })).toBeChecked();
    expect(within(section).getByRole('button', { name: '自动判断' })).toHaveClass('active');
    expect((within(section).getByLabelText('Planner Prompt') as HTMLTextAreaElement).value).toContain('每次只执行一个步骤');

    await user.click(within(section).getByRole('button', { name: '每次均规划' }));
    const prompt = within(section).getByLabelText('Planner Prompt');
    await user.clear(prompt);
    await user.type(prompt, '先生成结构化计划，再逐步执行。');

    const stored = JSON.parse(localStorage.getItem('uagent-advanced-config-v1') ?? '{}').planning;
    expect(stored.triggerMode).toBe('always');
    expect(stored.plannerPrompt).toBe('先生成结构化计划，再逐步执行。');
  });

  it('shows the active plan compactly and expands the full execution steps', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '帮我生成报表');
    await user.click(screen.getByRole('button', { name: '发送消息' }));

    const summary = screen.getByLabelText('查看执行计划');
    const details = summary.closest('details')!;
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByRole('status')).toHaveTextContent('理解报表需求');
    await user.click(summary);
    expect(details).toHaveAttribute('open');
    expect(screen.getByText('生成本月客服运营报表')).toBeInTheDocument();
    expect(screen.getByText('确认报表范围')).toBeInTheDocument();
    expect(screen.getByText('聚合客服数据')).toBeInTheDocument();
  });

  it('simulates the IM channel without exposing channel setup in Agent configuration', async () => {
    const user = userEvent.setup();
    render(<App />);
    const agentTabs = document.querySelector('.agent-tabs') as HTMLElement;
    expect(within(agentTabs).queryByRole('button', { name: '渠道' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('消息类型')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('模拟渠道'), 'whatsapp');
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '帮我查询订单');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    expect(document.querySelector('.runtime-channel')).toHaveTextContent('WhatsApp');
  });

  it('expands the global sidebar and shows read-only channel capabilities outside Agent configuration', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '展开侧边栏' }));
    expect(screen.getByRole('button', { name: '收起侧边栏' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '渠道' })).toHaveTextContent('渠道');

    await user.click(screen.getByRole('button', { name: '渠道' }));
    expect(screen.getByRole('heading', { name: '渠道能力' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '测试连接' })).not.toBeInTheDocument();
    expect(screen.queryByText('行为规则')).not.toBeInTheDocument();
    expect(screen.getByText('接收能力')).toBeInTheDocument();
    expect(screen.getByText('发送能力')).toBeInTheDocument();
    expect(screen.getAllByText('已接入')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: '新增渠道' })).not.toBeInTheDocument();
    expect(screen.queryByText('channel')).not.toBeInTheDocument();
  });

  it('configures lightweight customer memory and binds cross-channel identities', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '记忆库' }));
    expect(screen.getByRole('heading', { name: '长期记忆' })).toBeInTheDocument();
    expect(screen.getByText('客户资料 Profile')).toBeInTheDocument();
    expect(screen.getByText('会话摘要 Summary')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('主标识'), '已登录用户 ID');
    expect(screen.getByLabelText('主标识')).toHaveValue('已登录用户 ID');
    await user.click(screen.getByRole('button', { name: '自定义字段' }));
    await user.type(screen.getByLabelText('自定义字段名称'), '客户套餐');
    await user.type(screen.getByLabelText('自定义字段 Key'), 'plan');
    await user.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByDisplayValue('客户套餐')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('历史小结数量'));
    await user.type(screen.getByLabelText('历史小结数量'), '4');
    expect((screen.getByLabelText('客户资料抽取提示词') as HTMLTextAreaElement).value).toContain('不要猜测');
    expect((screen.getByLabelText('会话摘要提示词') as HTMLTextAreaElement).value).toContain('未解决事项');
    const stored = JSON.parse(localStorage.getItem('uagent-advanced-config-v1') ?? '{}').longMemory;
    expect(stored.identityKey).toBe('已登录用户 ID');
    expect(stored.profileFields.some((field: { key: string }) => field.key === 'plan')).toBe(true);
    expect(stored.recallCount).toBe(4);

    await user.click(screen.getByRole('button', { name: '客户记忆' }));
    expect(screen.getAllByText('ABC Manufacturing')).toHaveLength(2);
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '身份绑定' }));
    expect(screen.getByRole('dialog', { name: '身份绑定' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('绑定渠道'), 'Telegram');
    await user.type(screen.getByLabelText('渠道用户标识'), '@zhangning');
    await user.click(screen.getByRole('button', { name: '绑定' }));
    expect(screen.getAllByText('@zhangning')).toHaveLength(2);
    expect(screen.getAllByText('待验证')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: '完成' }));
    await user.click(screen.getByRole('button', { name: '会话摘要' }));
    expect(screen.getByText('API 请求频繁返回 429')).toBeInTheDocument();
    expect(screen.getByText('等待技术支持确认新限额')).toBeInTheDocument();
  });

  it('separates realtime monitoring from historical reports', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '监控' }));
    expect(screen.getByRole('heading', { name: '监控' })).toBeInTheDocument();
    expect(screen.getByText('当前服务状态')).toBeInTheDocument();
    expect(screen.getByText('部分服务受影响')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '实时运行' }));
    expect(screen.getAllByText('conv_81A2')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: '事件与事故' }));
    expect(screen.getByText('MODEL_RATE_LIMIT')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '依赖与容量' }));
    expect(screen.getByText('模型请求配额')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '报表' }));
    expect(screen.getByRole('heading', { name: '报表' })).toBeInTheDocument();
    expect(screen.getByText('获得回答机会')).toBeInTheDocument();
    expect(screen.queryByText('Agent 解决率')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '自动化漏斗' }));
    expect(screen.getAllByText('Agent受限').length).toBeGreaterThan(0);
    expect(screen.getAllByText('系统执行失败').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Agent能力' }));
    expect(screen.getAllByText('订单物流查询').length).toBeGreaterThan(0);
  });

  it('supports the complete monitoring and reporting operations workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '监控' }));
    expect(screen.getByLabelText('Agent 筛选')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '实时运行' }));
    await user.click(screen.getByRole('button', { name: '查看会话 conv_81A2' }));
    expect(screen.getByRole('dialog', { name: '会话详情' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看 Run 详情' }));
    expect(screen.getByRole('dialog', { name: 'Run 详情' })).toBeInTheDocument();
    expect(screen.getByText('Span 时间轴')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭 Run 详情' }));

    await user.click(screen.getByRole('button', { name: '事件与事故' }));
    await user.click(screen.getByRole('button', { name: '处理 INC-240731-03' }));
    expect(screen.getByRole('dialog', { name: '事故详情' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '更新处理进度' }));
    expect(screen.getAllByText('处理中').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '告警配置' }));
    await user.click(screen.getByRole('button', { name: '新建规则' }));
    expect(screen.getByRole('dialog', { name: '新建告警规则' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '保存规则' }));
    expect(screen.getByText('新建告警规则')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '报表' }));
    await user.click(screen.getByRole('button', { name: '指标口径' }));
    expect(screen.getByRole('dialog', { name: '指标口径与数据源' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭指标口径' }));
    await user.click(screen.getByRole('button', { name: '保存视图' }));
    expect(screen.getByRole('dialog', { name: '保存报表视图' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认保存视图' }));
    expect(screen.getByText('我的运营视图')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '导出' }));
    expect(screen.getByRole('dialog', { name: '导出任务' })).toBeInTheDocument();
    expect(screen.getByText('生成中')).toBeInTheDocument();
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

  it('configures input completion and keeps runtime message handling as fixed platform rules', async () => {
    const user = userEvent.setup();
    render(<App />);
    const conversation = screen.getByRole('heading', { name: '对话管理' }).closest('section')!;
    expect(within(conversation).getByRole('checkbox', { name: '连续消息合并' })).toBeChecked();
    await user.selectOptions(within(conversation).getByLabelText('输入结束判断'), 'typing');
    expect(within(conversation).getByLabelText('输入等待时间')).toHaveValue(5);
    expect(within(conversation).getByText('合并消息并重新执行')).toBeInTheDocument();
    expect(within(conversation).getByText('继续当前回复，进入下一轮队列')).toBeInTheDocument();
    expect(within(conversation).queryByText('用户插话时停止后续消息')).not.toBeInTheDocument();

    const response = screen.getByRole('heading', { name: '回复体验' }).closest('section')!;
    expect(within(response).getByRole('checkbox', { name: '多条消息回复' })).toBeChecked();
    expect(within(response).getByText('完整生成后分段发送')).toBeInTheDocument();
    expect(within(response).getByLabelText('消息发送间隔')).toHaveValue(800);
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
    await user.click(within(responseSection).getByRole('checkbox', { name: '多条消息回复' }));
    await user.type(screen.getByPlaceholderText('和机器人聊一聊吧'), '再查询一次订单状态');
    await user.click(screen.getByRole('button', { name: '发送消息' }));
    expect(container.querySelector('.streaming-message')).toBeInTheDocument();
  });

  it('restores legacy saved configurations without response experience fields', async () => {
    const user = userEvent.setup();
    localStorage.setItem('uagent-advanced-config-saved-v1', JSON.stringify({
      prompt: '旧版本保存的提示词',
      thinkingMode: 'fast',
      longMemory: { enabled: true, backupKeys: null, profileFields: null, profilePrompt: null, summaryPrompt: null }
    }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: '恢复已保存配置' }));

    expect(screen.getByDisplayValue('旧版本保存的提示词')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '模拟真人回复节奏' })).toBeChecked();
    expect(screen.getByLabelText('输入状态节奏')).toHaveValue('natural');
    await user.click(screen.getByRole('button', { name: '记忆库' }));
    expect(screen.getByText('客户资料 Profile')).toBeInTheDocument();
    expect((screen.getByLabelText('客户资料抽取提示词') as HTMLTextAreaElement).value).toContain('只提取用户明确表达的信息');
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

  it('configures privacy actions independently for input, tool results, and output', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '编辑输入规则 隐私与密钥' }));
    const dialog = screen.getByRole('dialog', { name: '隐私与密钥' });
    await user.selectOptions(within(dialog).getByLabelText('手机号输出处理'), 'BLOCK');
    expect(within(dialog).getAllByText('阻止处理').length).toBeGreaterThan(0);
    await user.click(within(dialog).getByRole('button', { name: '保存配置' }));

    await user.click(screen.getByRole('button', { name: '编辑输入规则 隐私与密钥' }));
    expect(within(screen.getByRole('dialog', { name: '隐私与密钥' })).getByLabelText('手机号输出处理')).toHaveValue('BLOCK');
  });

  it('tests a guardrail rule and configures scenario-specific fallback messages', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '测试输入规则 高风险操作关键词' }));
    const testDialog = screen.getByRole('dialog', { name: '测试规则' });
    await user.type(within(testDialog).getByLabelText('测试内容'), '请直接强制退款');
    await user.click(within(testDialog).getByRole('button', { name: '开始测试' }));
    expect(within(testDialog).getByText('检测命中')).toBeInTheDocument();
    expect(within(testDialog).getByText('CONFIRM')).toBeInTheDocument();
    await user.click(within(testDialog).getByRole('button', { name: '关闭规则测试' }));

    await user.click(screen.getByRole('button', { name: '兜底话术' }));
    const fallbackDialog = screen.getByRole('dialog', { name: '兜底话术' });
    const unavailable = within(fallbackDialog).getByLabelText('检测服务异常');
    await user.clear(unavailable);
    await user.type(unavailable, '安全检测服务暂时不可用，请稍后再试。');
    await user.click(within(fallbackDialog).getByRole('button', { name: '保存配置' }));
    expect(screen.getByText('5 个场景')).toBeInTheDocument();
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
    expect(screen.getByText('当前服务状态')).toBeInTheDocument();
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

  it('registers a reusable global tool with input and output fields', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '工具' }));
    expect(screen.getByRole('heading', { name: '工具' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '新建工具' }));
    const dialog = screen.getByRole('dialog', { name: '新建工具' });
    await user.type(within(dialog).getByLabelText('工具名称'), '查询物流轨迹');
    await user.type(within(dialog).getByLabelText('工具标识'), 'logistics.track');
    await user.type(within(dialog).getByLabelText('接口地址'), 'https://api.example.com/logistics/{order_id}');
    await user.type(within(dialog).getByLabelText('输入参数参数名'), 'order_id');
    await user.type(within(dialog).getByLabelText('输出参数参数名'), 'tracking_status');
    await user.click(within(dialog).getByRole('button', { name: '保存工具' }));

    expect(screen.getByText('查询物流轨迹')).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('uagent-global-tools-v1') ?? '[]');
    expect(saved.find((tool: { key: string }) => tool.key === 'logistics.track').inputFields[0].name).toBe('order_id');
    expect(saved.find((tool: { key: string }) => tool.key === 'logistics.track').outputFields[0].name).toBe('tracking_status');
  });

  it('auto-discovers Skill Python tools and saves runtime customer messages', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/?view=skills');
    render(<App />);

    await user.click(screen.getByText('客户资料更新').closest('button')!);
    await user.click(screen.getByRole('button', { name: '工具配置' }));
    expect(screen.getAllByText('get_customer_update_profile')).toHaveLength(2);
    expect(screen.getByText('submit_account_update')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('兜底处理'), 'handoff');
    await user.clear(screen.getByLabelText('开始调用话术'));
    await user.type(screen.getByLabelText('开始调用话术'), '我先帮您查询订单。');
    await user.clear(screen.getByLabelText('工具超时时间'));
    await user.type(screen.getByLabelText('工具超时时间'), '12');
    await user.clear(screen.getByLabelText('客户插话话术'));
    await user.type(screen.getByLabelText('客户插话话术'), '查询还在继续，请稍等。');
    await user.click(screen.getByRole('button', { name: '保存草稿' }));

    const skills = JSON.parse(localStorage.getItem('uagent-managed-skills-v1') ?? '[]');
    const binding = skills.find((skill: { id: string }) => skill.id === 'skill-account-update').toolBindings.find((item: { toolId: string }) => item.toolId.endsWith(':get_customer_update_profile'));
    expect(binding.fallbackAction).toBe('handoff');
    expect(binding.startMessage).toBe('我先帮您查询订单。');
    expect(binding.timeoutSeconds).toBe(12);
    expect(binding.progressMessage).toBe('查询还在继续，请稍等。');
  });
});
