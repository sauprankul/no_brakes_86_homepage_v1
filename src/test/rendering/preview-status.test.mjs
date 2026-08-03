import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { previewPublicationBadge, previewPublicationDate } from '../../scripts/preview-status.mjs';

const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('unpublished previews render an explicit red-status hook while published previews stay unlabelled', () => {
  assert.equal(previewPublicationBadge({ published: true }), '');
  assert.equal(previewPublicationBadge({ published: false }), '<span class="preview-status preview-status--unpublished">Unpublished</span>');
  assert.match(stylesheet, /\.preview-status \{[^}]*background: #9d2630; border: 1px solid #df5961;/);
});

test('an unpublished preview does not repeat its state as a Draft date label', () => {
  assert.equal(previewPublicationDate({ published: false, date: null }, (date) => date), '');
  assert.equal(previewPublicationDate({ published: true, date: '2026-08-03' }, (date) => `Published ${date}`), 'Published 2026-08-03');
});
