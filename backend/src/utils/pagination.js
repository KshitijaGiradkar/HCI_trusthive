/**
 * @param {number} page
 * @param {number} limit
 */
export function paginate(page = 1, limit = 12) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 12));
  return {
    page: p,
    limit: l,
    skip: (p - 1) * l,
    take: l,
  };
}

/**
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
export function paginationMeta(total, page, limit) {
  return {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
