import { parseInline, parseMarkdown } from '@/src/chat/markdownParse';

const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) {
      throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(`expected ${b}\n     got ${a}`);
  },
};

// Inline
assert.deepEqual(parseInline('plain'), [{ type: 'text', text: 'plain' }]);
assert.deepEqual(parseInline('a **b** c'), [
  { type: 'text', text: 'a ' },
  { type: 'bold', children: [{ type: 'text', text: 'b' }] },
  { type: 'text', text: ' c' },
]);
assert.deepEqual(parseInline('use `npm test` now'), [
  { type: 'text', text: 'use ' },
  { type: 'code', text: 'npm test' },
  { type: 'text', text: ' now' },
]);
assert.deepEqual(parseInline('see [docs](https://x.y/z)'), [
  { type: 'text', text: 'see ' },
  { type: 'link', text: 'docs', href: 'https://x.y/z' },
]);
assert.deepEqual(parseInline('*it* and _it_'), [
  { type: 'italic', children: [{ type: 'text', text: 'it' }] },
  { type: 'text', text: ' and ' },
  { type: 'italic', children: [{ type: 'text', text: 'it' }] },
]);
// Code nests inside emphasis.
assert.deepEqual(parseInline('**`fn()` runs**'), [
  {
    type: 'bold',
    children: [
      { type: 'code', text: 'fn()' },
      { type: 'text', text: ' runs' },
    ],
  },
]);
// A bare asterisk or underscore is left alone.
assert.deepEqual(parseInline('2 * 3 and snake_case_name'), [
  { type: 'text', text: '2 * 3 and snake_case_name' },
]);

// Blocks
const blocks = parseMarkdown(
  [
    '## Plan',
    '',
    'First line',
    'same paragraph',
    '',
    '- one',
    '- **two**',
    '1. first',
    '2. second',
    '```',
    'const x = 1;',
    '```',
    'tail',
  ].join('\n'),
);
assert.deepEqual(
  blocks.map((b) => b.type),
  ['heading', 'paragraph', 'list', 'list', 'code', 'paragraph'],
);
assert.equal(blocks[0].type === 'heading' && blocks[0].level, 2);
assert.deepEqual(blocks[1].type === 'paragraph' && blocks[1].inlines, [
  { type: 'text', text: 'First line same paragraph' },
]);
assert.equal(blocks[2].type === 'list' && blocks[2].ordered, false);
assert.equal(blocks[2].type === 'list' && blocks[2].items.length, 2);
assert.equal(blocks[3].type === 'list' && blocks[3].ordered, true);
assert.equal(blocks[4].type === 'code' && blocks[4].text, 'const x = 1;');

// Unterminated fence still yields a code block, never throws.
assert.deepEqual(parseMarkdown('```\nx'), [{ type: 'code', text: 'x' }]);
// Empty input renders nothing.
assert.deepEqual(parseMarkdown(''), []);

console.log('markdownParse ok');
