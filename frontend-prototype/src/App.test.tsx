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
    expect(screen.getByText('Doubao-Seed-2.0-pro')).toBeInTheDocument();

    for (const section of ['提示词', '思考模式', '变量', '技能', '工具', '知识库', '长期记忆', '上下文压缩', '会话变量', '反思机制', '人工审核', '护栏配置']) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
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

    expect((await screen.findAllByText('CONFIRM')).length).toBeGreaterThanOrEqual(1);
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
    await user.click(screen.getByRole('button', { name: '监控图表' }));
    expect(screen.getByText('所有会话次数')).toBeInTheDocument();
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
