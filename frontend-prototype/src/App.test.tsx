import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('advanced agent configuration prototype', () => {
  beforeEach(() => localStorage.clear());

  it('renders the current advanced-agent workspace and configuration modules', () => {
    render(<App />);

    expect(screen.getByText('Udesk Agent')).toBeInTheDocument();
    expect(screen.getByText('新建一个测试')).toBeInTheDocument();
    expect(screen.getByText('Doubao-Seed-2.0-pro')).toBeInTheDocument();

    for (const section of ['提示词', '思考模式', '变量', '技能', '工具', '知识库', '长期记忆', '上下文压缩', '会话变量', '反思机制', '人工审核', '护栏配置']) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
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
});
