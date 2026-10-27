/** Total and published counts of generated pages, split into product pages and stores. */
export function countPagesByGenerationType(pages) {
  const list = Array.isArray(pages) ? pages : [];
  const counts = {
    product: { total: 0, published: 0 },
    store: { total: 0, published: 0 },
  };
  for (const p of list) {
    const bucket = p?.generation_type === "store" ? counts.store : counts.product;
    bucket.total += 1;
    if (p?.published) bucket.published += 1;
  }
  return counts;
}
