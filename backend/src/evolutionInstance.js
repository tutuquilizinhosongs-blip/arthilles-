const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INSTANCE_PATTERN = /^arthilles-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export function normalizeCompanyId(companyId) {
  const value = String(companyId || '').trim().toLowerCase();
  return UUID_PATTERN.test(value) ? value : null;
}

export function evolutionInstanceForCompanyId(companyId) {
  const normalized = normalizeCompanyId(companyId);
  if (!normalized) return null;
  return `arthilles-${normalized}`;
}

export function companyIdFromEvolutionInstance(instanceName) {
  const value = String(instanceName || '').trim().toLowerCase();
  const match = value.match(INSTANCE_PATTERN);
  return match?.[1] || null;
}
