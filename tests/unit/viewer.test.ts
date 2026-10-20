import { expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentContent } from '../../src/apps/Viewer';

it('텍스트·시맨틱 표·도식 대체 텍스트를 표시한다', () => {
  const render = (content: Parameters<typeof DocumentContent>[0]['content']) => renderToStaticMarkup(createElement(DocumentContent, { content }));
  expect(render({ kind: 'text', paragraphs: ['읽는 본문 <script>'] })).toContain('읽는 본문 &lt;script&gt;');
  const table = render({ kind: 'table', columns: ['항목', '금액'], rows: [['설치비', '800,000']] });
  expect(table).toContain('<table>');
  expect(table).toContain('<th scope="col">금액</th>');
  expect(table).toContain('800,000');
  expect(render({ kind: 'diagram', assetId: 'poster', alt: '첫 전시 · 2024.04.17 개막' })).toContain('첫 전시 · 2024.04.17 개막');
});
