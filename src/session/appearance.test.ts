import { appearanceLabel, nextAppearance } from '@/src/session/appearance';

function run() {
  if (nextAppearance('system') !== 'light') throw new Error('system → light');
  if (nextAppearance('light') !== 'system') throw new Error('light → system');
  if (appearanceLabel('light') !== 'Light') throw new Error('label');
}

run();
console.log('appearance ok');
