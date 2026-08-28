import {
  isRestoring,
  needsConnect,
  needsName,
} from '@/src/domain/session';
import { createMockSessionStore } from '@/src/session/mockSessionStore';

async function expectReject(run: () => Promise<unknown>, message: string) {
  try {
    await run();
  } catch (err) {
    if (err instanceof Error && err.message === message) return;
    throw err;
  }
  throw new Error(`expected rejection: ${message}`);
}

async function run() {
  const store = createMockSessionStore();
  if (!needsConnect(store.get())) throw new Error('expected connect gate');

  await expectReject(() => store.connectKey('   ', true), 'Key is required');

  await store.connectKey('sky_live_example', true);
  const connected = store.get();
  if (connected.status !== 'authenticated') throw new Error('expected session');
  if (needsConnect(connected)) throw new Error('connect gate should be closed');
  if (!needsName(connected)) throw new Error('a new user must name themselves');
  if ('key' in connected) throw new Error('key must not live on session');

  await expectReject(() => store.setDisplayName('  '), 'Name is required');

  await store.setDisplayName('  Waz  ');
  if (store.get().displayName !== 'Waz') throw new Error('name not trimmed');
  if (needsName(store.get())) throw new Error('name gate should be closed');

  await store.logout();
  if (!needsConnect(store.get())) throw new Error('logout failed');
  if (store.get().displayName !== null) throw new Error('name outlived logout');

  const booting = createMockSessionStore({
    status: 'restoring',
    displayName: null,
    keyPrefix: null,
  });
  if (!isRestoring(booting.get())) throw new Error('expected restoring');
  if (needsConnect(booting.get())) {
    throw new Error('restoring must not open the connect gate');
  }
  await booting.restore();
  if (isRestoring(booting.get())) throw new Error('restore should settle');
}

run().then(
  () => {
    console.log('mockSessionStore ok');
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
