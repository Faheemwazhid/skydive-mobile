import { isSystemConversation } from '../src/routes/chat';

const t = '2026-09-02T02:33:00.839Z';
const later = '2026-09-02T03:00:00.000Z';
const cases: [boolean, Parameters<typeof isSystemConversation>[0]][] = [
  [true, { title: 'Dreaming', createdAt: t, updatedAt: t }],
  [false, { title: 'Dreaming', createdAt: t, updatedAt: later }],
  [false, { title: 'Review app', createdAt: t, updatedAt: t }],
  [false, { title: 'Dreaming', createdAt: null, updatedAt: null }],
];
for (const [expected, input] of cases) {
  const got = isSystemConversation(input);
  if (got !== expected) {
    throw new Error(`${JSON.stringify(input)}: expected ${expected}, got ${got}`);
  }
}
console.log('systemConversation ok');
