import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeDiscoveryPage } from './KnowledgeDiscoveryPage';

describe('KnowledgeDiscoveryPage', () => {
  it('reviews source conversation and adopts a discovery into a selected knowledge space', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<KnowledgeDiscoveryPage notify={notify} />);

    await user.click(screen.getAllByRole('button', { name: '详情' })[0]);
    expect(screen.getByRole('heading', { name: '知识详情' })).toBeInTheDocument();
    expect(screen.getByText('c6e1542a-88fa-414d-881a-f156c148cf2b')).toBeInTheDocument();
    expect(screen.getByText('好的，这个信息就够了，谢谢。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '采纳' }));
    const dialog = screen.getByRole('dialog', { name: '选择知识空间' });
    await user.click(within(dialog).getByRole('button', { name: /订单与物流知识空间/ }));
    await user.click(within(dialog).getByRole('button', { name: '确认采纳' }));

    expect(screen.getByRole('heading', { name: '知识发现' })).toBeInTheDocument();
    expect(screen.getAllByText('已采纳').length).toBeGreaterThan(0);
    expect(notify).toHaveBeenCalledWith('已采纳到订单与物流知识空间');
  });

  it('toggles automatic extraction per agent and opens that agent extraction conditions', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<KnowledgeDiscoveryPage notify={notify} />);

    await user.click(screen.getByRole('button', { name: '知识发现设置' }));
    expect(screen.getByRole('heading', { name: '知识发现设置' })).toBeInTheDocument();

    const toggle = screen.getByRole('checkbox', { name: '业务办理助手自动抽取' });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();

    await user.click(screen.getAllByRole('button', { name: '配置抽取条件' })[0]);
    const prompt = screen.getByRole('dialog', { name: /配置售后服务助手抽取条件/ });
    expect(within(prompt).getByDisplayValue(/售后政策、服务网点/)).toBeInTheDocument();
    await user.click(within(prompt).getByRole('button', { name: '保存抽取条件' }));
    expect(notify).toHaveBeenCalledWith('售后服务助手的抽取条件已保存');
  });

  it('shows a real custom date range and ignores selected discoveries in batch', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<KnowledgeDiscoveryPage notify={notify} />);

    await user.selectOptions(screen.getByRole('combobox', { name: '按发现时间筛选' }), '自定义时间');
    expect(screen.getByLabelText('开始日期')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('结束日期')).toHaveAttribute('type', 'date');

    await user.click(screen.getByRole('checkbox', { name: /选择 附近的服务网点周末营业吗？/ }));
    await user.click(screen.getByRole('button', { name: '批量忽略' }));

    expect(screen.getAllByText('已忽略').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '采纳' })).toHaveLength(2);
    expect(notify).toHaveBeenCalledWith('已忽略 1 条知识发现');
  });
});
