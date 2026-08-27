export type Appearance = 'system' | 'light';

export function nextAppearance(current: Appearance): Appearance {
  return current === 'system' ? 'light' : 'system';
}

export function appearanceLabel(value: Appearance): string {
  return value === 'system' ? 'Match system' : 'Light';
}
