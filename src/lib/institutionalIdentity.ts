/**
 * LASU Advisor credentials are institutional identifiers, not email addresses.
 * Supabase still requires an email-shaped value internally, so this value is
 * deterministic, non-routable and never shown to or supplied by a user.
 */
export function normalizeInstitutionalIdentifier(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9/_-]/g, '');
}

export function internalAuthEmail(identifier: string): string {
  const normalized = normalizeInstitutionalIdentifier(identifier);
  const localPart = normalized.replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  if (!localPart) throw new Error('A valid matriculation or registration number is required.');
  return `id-${localPart}@lasu.edu.ng`;
}
