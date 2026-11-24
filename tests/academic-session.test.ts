import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrentAcademicSession, nextAcademicSession } from '../src/lib/academicUtils';

test('advances both academic session years by one', () => {
  assert.equal(nextAcademicSession('2023/2024'), '2024/2025');
});

test('rejects malformed or nonconsecutive academic sessions', () => {
  assert.throws(() => nextAcademicSession('2023-2024'), /YYYY\/YYYY/);
  assert.throws(() => nextAcademicSession('2023/2025'), /consecutive/);
});

test('date fallback uses July as the academic year rollover', () => {
  assert.equal(getCurrentAcademicSession(new Date(2025, 5, 30)), '2024/2025');
  assert.equal(getCurrentAcademicSession(new Date(2025, 6, 1)), '2025/2026');
});

