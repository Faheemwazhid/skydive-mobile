import { router } from 'expo-router';

export function go(href: string) {
  router.push(href as never);
}

export function swap(href: string) {
  router.replace(href as never);
}
