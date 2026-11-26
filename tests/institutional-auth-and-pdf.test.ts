import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInstitutionalIdentifier, internalAuthEmail } from '../src/lib/institutionalIdentity';
import { parseTranscriptText } from '../src/lib/transcriptTextParser';

test('normalizes matriculation and registration numbers consistently', () => {
  assert.equal(normalizeInstitutionalIdentifier(' csc/21/0045 '), 'CSC/21/0045');
  assert.equal(normalizeInstitutionalIdentifier('dn241728997045'), 'DN241728997045');
  assert.equal(internalAuthEmail('DN241728997045'), 'id-dn241728997045@lasu.edu.ng');
  assert.equal(internalAuthEmail('CSC/21/0045'), 'id-csc-21-0045@lasu.edu.ng');
});

test('extracts application/registration number and courses from sample LASU statement of results', () => {
  const sampleText = `
LAGOS STATE UNIVERSITY
FACULTY OF COMPUTING AND INFORMATION TECHNOLOGY
DIPLOMA PROGRAMMES • DEPARTMENT OF COMPUTER SCIENCE
STUDENT ACADEMIC STATEMENT OF RESULTS
Doc Reference: LASU/DIP/TR/DN241728997045
Date Generated: 25 Nov 2026 23:00

STUDENT PARTICULARS & BIO-DATA
FULL NAME MATRICULATION NUMBER
AYOMIDE IFEDAYO DANIEL N/A
APPLICATION NUMBER PROGRAMME / COURSE OF STUDY
DN241728997045 Computer Science
SESSION OF ADMISSION EXPECTED EXIT SESSION
2024/2025 2024/2025

2025/2026 — FIRST SEMESTER
COURSE CODE COURSE TITLE UNIT CA (30) EXAM (70) TOTAL GRADE GP POINTS (CP)
CSD 027 Computer Application Packages II 2 29.0 68.0 97.0 A 5.00 10.0
CSD 029 Computer Systems Troubleshooting 2 28.0 50.0 78.0 A 5.00 10.0
Ref: DN241728997045 | 25 Nov 2026
`;

  const parsed = parseTranscriptText(sampleText, 'sample-result.pdf');
  assert.equal(parsed.studentName, 'AYOMIDE IFEDAYO DANIEL');
  assert.equal(parsed.matricNo, 'DN241728997045');
  assert.equal(parsed.registrationNo, 'DN241728997045');
  assert.ok(parsed.documentIdentifiers?.includes('DN241728997045'));
  assert.equal(parsed.courses.length, 2);
  assert.equal(parsed.courses[0].code, 'CSD 027');
  assert.equal(parsed.courses[1].code, 'CSD 029');
});

test('extracts standard matriculation number from labeled transcript text', () => {
  const sampleText = `
Student Name: Michael Adebayo
Matriculation Number: CSC/21/0045
2024/2025 FIRST SEMESTER
CSC 301 Operating Systems 3 25 55 80 A 5.00 15.0
`;

  const parsed = parseTranscriptText(sampleText, 'transcript.pdf');
  assert.equal(parsed.studentName, 'Michael Adebayo');
  assert.equal(parsed.matricNo, 'CSC/21/0045');
  assert.ok(parsed.documentIdentifiers?.includes('CSC/21/0045'));
  assert.equal(parsed.courses.length, 1);
  assert.equal(parsed.courses[0].code, 'CSC 301');
});
