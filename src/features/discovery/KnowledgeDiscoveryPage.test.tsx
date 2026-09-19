import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeDiscoveryPage } from './KnowledgeDiscoveryPage';

describe('KnowledgeDiscoveryPage', () => {
  it('reviews source conversation and adds a discovery to a selected knowledge space', async () => {
    const user = userEvent.setup();
    render(<KnowledgeDiscoveryPage notify={vi.fn()} />);

    await user.click(screen.getAllByRole('button', { name: '详情' })[0]);
    expect(screen.getByRole('heading', { name: '知识详情' })).toBeInTheDocument();
    expect(screen.getByText('c6e1542a-88fa-414d-881a-f156c148cf2b')).toBeInTheDocument();
    expect(screen.getByText('好的，这个信息就够了，谢谢。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /加入知识空间/ }));
    const dialog = screen.getByRole('dialog', { name: '选择知识空间' });
    await user.click(within(dialog).getByRole('button', { name: /订单与物流知识空间/ }));
    await user.click(within(dialog).getByRole('button', { name: '确认加入' }));

    expect(screen.getByRole('heading', { name: '知识发现' })).toBeInTheDocument();
    expect(screen.getAllByText('已入库').length).toBeGreaterThan(0);
  });

  it('selects agents and opens an agent-specific extraction prompt', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<KnowledgeDiscoveryPage notify={notify} />);

    await user.click(screen.getByRole('button', { name: '知识发现设置' }));
    expect(screen.getByRole('heading', { name: '知识发现设置' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '选择智能体' }));
    const picker = screen.getByRole('dialog', { name: '选择智能体' });
    await user.click(within(picker).getByRole('checkbox', { name: /业务办理助手/ }));
    await user.click(within(picker).getByRole('button', { name: '确定' }));

    const promptButtons = screen.getAllByRole('button', { name: '配置提示词' });
    await user.click(promptButtons[0]);
    const prompt = screen.getByRole('dialog', { name: /配置售后服务助手抽取提示词/ });
    expect(within(prompt).getByDisplayValue(/售后政策、服务网点/)).toBeInTheDocument();
    await user.click(within(prompt).getByRole('button', { name: '保存提示词' }));
    expect(notify).toHaveBeenCalledWith('售后服务助手的抽取提示词已保存');
  });

  it('shows a real custom date range and runs a manual extraction task', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<KnowledgeDiscoveryPage notify={notify} />);

    await user.selectOptions(screen.getByRole('combobox', { name: '按发现时间筛选' }), '自定义时间');
    expect(screen.getByLabelText('开始日期')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('结束日期')).toHaveAttribute('type', 'date');

    await user.click(screen.getByRole('button', { name: '手动抽取' }));
    const dialog = screen.getByRole('dialog', { name: '手动抽取知识' });
    await user.selectOptions(within(dialog).getByRole('combobox', { name: '抽取智能体' }), '订单助手');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: '抽取客服系统账号' }), 'Udesk IM·电商售后');
    await user.clear(within(dialog).getByLabelText('手动抽取开始日期'));
    await user.type(within(dialog).getByLabelText('手动抽取开始日期'), '2026-09-15');
    await user.click(within(dialog).getByRole('button', { name: '开始抽取' }));

    expect(screen.queryByRole('dialog', { name: '手动抽取知识' })).not.toBeInTheDocument();
    expect(screen.getByText('服务网点办理业务需要提前预约吗？')).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('手动抽取完成，新增 1 条待处理知识');
  });
});
