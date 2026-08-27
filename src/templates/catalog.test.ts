import { getTemplate, templates } from '@/src/templates/catalog';

function run() {
  if (templates.length < 6) throw new Error('catalog too small');
  for (const t of templates) {
    const blob = JSON.stringify(t).toLowerCase();
    if (blob.includes('skill')) throw new Error(`${t.id} mentions skills`);
    if (t.worksWith.length === 0 || t.whatYouGet.length === 0) {
      throw new Error(`${t.id} missing copy fields`);
    }
  }
  const found = getTemplate('chief-of-staff');
  if (!found) throw new Error('lookup');
  if (getTemplate('nope')) throw new Error('unknown should miss');
}

run();
console.log('catalog ok');
