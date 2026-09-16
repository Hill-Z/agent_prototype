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

  it('includes a four-column pagination rhythm, concise field descriptions and a two-button limit', () => {
    expect(script).toContain('PAGE_SIZE = 8');
    expect(script).toContain('字段说明');
    expect(script).toContain('draft.actions.length >= 2');
    expect(script).toContain('背景颜色');
    expect(script).toContain('文字颜色');
  });

  it('supports array tags and a horizontally scrollable product preview', () => {
    expect(script).toContain("field.tagPreview !== 'multiple'");
    expect(script).toContain('Array.isArray(sample)');
    expect(script).toContain('productImages[(imageOffset + index) % productImages.length]');
  });

  it('supports API fields, fixed content and fallback defaults', () => {
    expect(script).toContain("source: 'field'");
    expect(script).toContain('固定内容');
    expect(script).toContain('defaultValue');
    expect(script).toContain('custom_fields.TextField_38');
  });
});
