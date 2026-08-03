import assert from 'node:assert/strict';
import test from 'node:test';
import { parentFocus, rootIdForEntry, sidebarContext } from '../scripts/sidebar-navigation.mjs';

const categories = [{ id: 'race', short: '86 Challenge' }, { id: 'blog', short: 'Blog' }];
const entries = [
  { id: '2026', title: '2026', parent: 'race', category: 'race' },
  { id: 'round-1', title: 'Round 1', parent: '2026', category: 'race' },
  { id: 'cyclone', title: 'East Cyclone', parent: 'round-1', category: 'race' },
  { id: 'round-2', title: 'Round 2', parent: '2026', category: 'race' },
  { id: 'tire-notes', title: 'Tire notes', parent: 'blog', category: 'blog' },
];

test('sidebar navigation supports arbitrary depth by drilling into one branch at a time', () => {
  assert.equal(rootIdForEntry(entries, 'cyclone'), 'race');
  const context = sidebarContext({ categories, entries, rootId: 'race', focusId: '2026' });
  assert.deepEqual(context.path.map((entry) => entry.id), ['2026']);
  assert.deepEqual(context.children.map((entry) => entry.id), ['round-1', 'round-2']);
  assert.equal(parentFocus(entries, 'race', '2026'), null);
  assert.equal(parentFocus(entries, 'race', 'round-1'), '2026');
});
