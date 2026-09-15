import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync('public/cards/index.html', 'utf8');
const script = readFileSync('public/cards/card-studio.js', 'utf8');

describe('customer-defined card studio', () => {
  it('loads the redesigned card studio assets', () => {
    expect(html).toContain('card-studio.css');
    expect(html).toContain('card-studio.js');
  });

  it('uses two custom visual starters instead of built-in business schemas', () => {
    expect(script).toContain("data-starter=\"info\"");
    expect(script).toContain("data-starter=\"product\"");
    expect(script).not.toContain('ticket_summary_card');
    expect(script).not.toContain('ticket_detail_card');
  });

  it('includes pagination, model-facing field descriptions and a two-button limit', () => {
    expect(script).toContain('PAGE_SIZE = 6');
    expect(script).toContain('字段说明（给大模型）');
    expect(script).toContain('draft.actions.length >= 2');
    expect(script).toContain('背景颜色');
    expect(script).toContain('文字颜色');
  });
});
