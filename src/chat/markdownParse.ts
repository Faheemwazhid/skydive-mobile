/**
 * The subset of Markdown agent replies actually use: paragraphs, headings,
 * bullet and numbered lists, fenced code, and inline bold / italic / code /
 * links. Pure functions so they can be unit tested without React Native.
 */
export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'italic'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

export type Block =
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'heading'; level: number; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; text: string };

// Emphasis must open and close against a non-word character so that
// `snake_case_name` and `2 * 3` stay literal.
const INLINE =
  /(`[^`\n]+`)|(\*\*\S(?:[^\n]*?\S)?\*\*)|(__\S(?:[^\n]*?\S)?__)|(?<!\w)(\*\S[^*\n]*?\S\*|\*\S\*)(?!\w)|(?<!\w)(_\S[^_\n]*?\S_|_\S_)(?!\w)|(\[[^\]\n]+\]\([^)\s]+\))/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: 'text', text: text.slice(last, index) });
    const raw = match[0];
    if (raw.startsWith('`')) {
      out.push({ type: 'code', text: raw.slice(1, -1) });
    } else if (raw.startsWith('**') || raw.startsWith('__')) {
      out.push({ type: 'bold', children: parseInline(raw.slice(2, -2)) });
    } else if (raw.startsWith('[')) {
      const close = raw.indexOf('](');
      out.push({
        type: 'link',
        text: raw.slice(1, close),
        href: raw.slice(close + 2, -1),
      });
    } else {
      out.push({ type: 'italic', children: parseInline(raw.slice(1, -1)) });
    }
    last = index + raw.length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const FENCE = /^\s*```/;

export function parseMarkdown(body: string): Block[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    blocks.push({
      type: 'paragraph',
      inlines: parseInline(paragraph.join(' ')),
    });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (FENCE.test(line)) {
      flush();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        inlines: parseInline(heading[2]),
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flush();
      const ordered = numbered !== null;
      const previous = blocks[blocks.length - 1];
      if (previous?.type === 'list' && previous.ordered === ordered) {
        previous.items.push(parseInline(item[1]));
      } else {
        blocks.push({ type: 'list', ordered, items: [parseInline(item[1])] });
      }
      continue;
    }

    if (line.trim() === '') {
      flush();
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}
