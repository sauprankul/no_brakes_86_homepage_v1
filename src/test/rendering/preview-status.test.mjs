import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { previewPublicationBadge } from '../../scripts/preview-status.mjs';

const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('unpublished previews render an explicit red-status hook while published previews stay unlabelled', () => {
  assert.equal(previewPublicationBadge({ published: true }), '');
  assert.equal(previewPublicationBadge({ published: false }), '<span class="preview-status preview-status--unpublished">Unpublished</span>');
  assert.match(stylesheet, /\.preview-status \{[^}]*background: #9d2630; border: 1px solid #df5961;/);
});
