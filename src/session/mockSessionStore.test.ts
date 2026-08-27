import { createMockSessionStore } from '@/src/session/mockSessionStore';
import { needsConnect, needsLogin } from '@/src/domain/session';

async function run() {
  const store = createMockSessionStore();
  if (!needsLogin(store.get())) throw new Error('expected logged out');

  await store.login('  waz@skydive.com  ');
  if (store.get().email !== 'waz@skydive.com') {
    throw new Error('email not trimmed');
  }
  if (!needsConnect(store.get())) throw new Error('expected connect gate');

  try {
    await store.connectKey('   ');
    throw new Error('empty key should fail');
  } catch (err) {
    if (!(err instanceof Error) || err.message !== 'Key is required') {
      throw err;
    }
  }

  await store.connectKey('sky_live_example');
  const connected = store.get();
  if (!connected.connected) throw new Error('expected connected');
  if (needsConnect(connected) || needsLogin(connected)) {
    throw new Error('gates should be closed');
  }
  if ('key' in connected) throw new Error('key must not live on session');

  await store.logout();
  if (store.get().email !== null) throw new Error('logout failed');

  await store.login('a@b.c');
  await store.skipConnect();
  if (needsConnect(store.get())) throw new Error('skip should close connect');
  if (store.get().connected) throw new Error('skip is not connected');

  await store.beginConnect();
  if (!needsConnect(store.get())) {
    throw new Error('beginConnect should reopen connect');
  }
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
