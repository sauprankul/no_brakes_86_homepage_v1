import assert from 'node:assert/strict';
import test from 'node:test';
import { hierarchyPath, navigationEntryClasses, parentFocus, rootIdForEntry, sidebarContext } from '../../scripts/sidebar-navigation.mjs';
import { clickAction, isWidescreen, navigationChildren, shouldDismissSidebar, shouldInterceptInternalLink } from '../../scripts/navigation-policy.mjs';

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

test('dev navigation visibly marks draft categories and child entries without changing production navigation', () => {
  assert.match(navigationEntryClasses({ published: false }, { baseClass: 'tree__category', previewMode: true }), /tree__category.*is-unpublished/);
  assert.match(navigationEntryClasses({ published: false }, { previewMode: true }), /is-unpublished/);
  assert.doesNotMatch(navigationEntryClasses({ published: true }, { previewMode: true }), /is-unpublished/);
  assert.doesNotMatch(navigationEntryClasses({ published: false }, { previewMode: false }), /is-unpublished/);
  assert.match(navigationEntryClasses({ published: true }, { active: true }), /is-active/);
});

test('breadcrumbs include Home’s full entry hierarchy', () => {
  assert.deepEqual(hierarchyPath(categories, entries, 'cyclone').map((entry) => entry.id), ['race', '2026', 'round-1', 'cyclone']);
});

test('a parent expands first, lists only five children, then opens when already expanded', () => {
  const children = Array.from({ length: 6 }, (_, index) => ({ id: `child-${index + 1}` }));
  assert.equal(clickAction({ hasChildren: true, expanded: false }), 'expand');
  assert.equal(clickAction({ hasChildren: true, expanded: true }), 'open');
  assert.equal(clickAction({ hasChildren: false, expanded: false }), 'open');
  assert.deepEqual(navigationChildren(children).visible.map((child) => child.id), ['child-1', 'child-2', 'child-3', 'child-4', 'child-5']);
  assert.equal(navigationChildren(children).hasMore, true);
});

test('widescreen navigation stays persistent and narrow navigation dismisses on outside click', () => {
  assert.equal(isWidescreen(1600, 900), true);
  assert.equal(isWidescreen(390, 844), false);
  assert.equal(shouldDismissSidebar({ wide: false, clickedInsideSidebar: false, clickedToggle: false }), true);
  assert.equal(shouldDismissSidebar({ wide: true, clickedInsideSidebar: false, clickedToggle: false }), false);
  assert.equal(shouldDismissSidebar({ wide: false, clickedInsideSidebar: true, clickedToggle: false }), false);
});

test('download links bypass SPA routing while ordinary internal links stay client-routed', () => {
  assert.equal(shouldInterceptInternalLink({ href: '/86-challenge', download: false, modified: false }), true);
  assert.equal(shouldInterceptInternalLink({ href: '/86-challenge/downloads/data.csv', download: true, modified: false }), false);
  assert.equal(shouldInterceptInternalLink({ href: '/86-challenge', download: false, modified: true }), false);
});
