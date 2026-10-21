import { authenticate } from "../shopify.server";

const COLLECTIONS_PAGE_QUERY = `#graphql
  query StoreCollectionsPage($cursor: String) {
    collections(first: 20, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        legacyResourceId
        title
        handle
        description
        updatedAt
        sortOrder
        ruleSet {
          appliedDisjunctively
          rules { column relation condition }
        }
        image { url altText }
        productsCount { count }
        products(first: 100) {
          pageInfo { hasNextPage }
          nodes {
            id
            title
            handle
            tags
            vendor
            productType
            createdAt
            featuredImage { url }
          }
        }
      }
    }
  }
`;

const PRODUCTS_PAGE_QUERY = `#graphql
  query StoreProductsPage($cursor: String) {
    products(first: 100, after: $cursor, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        tags
        vendor
        productType
        createdAt
        featuredImage { url }
      }
    }
  }
`;

const COLLECTION_CREATE_MUTATION = `#graphql
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id title handle updatedAt productsCount { count } }
      userErrors { field message }
    }
  }
`;

const COLLECTION_ADD_PRODUCTS_MUTATION = `#graphql
  mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      userErrors { field message }
    }
  }
`;

const jsonHeaders = { "Content-Type": "application/json" };
const MIN_COLLECTION_PRODUCTS = 3;
const MIN_BACKFILL_SCORE = 8;
const MIN_CLUSTER_PRODUCTS = 3;
const MIN_CLUSTER_COHESION = 0.85;

const isGoodTitle = (title) => {
  const t = String(title || "").trim().toLowerCase();
  if (!t) return false;
  if (t.startsWith("collection")) return false;
  if (t === "all" || t === "all products") return false;
  return true;
};

const hasImage = (c) => Boolean(c?.image?.url);
const toMs = (iso) => (iso ? Date.parse(iso) || 0 : 0);

function scoreCollection(c) {
  const count = Number(c.productCount || c.products?.length || 0);
  const imageScore = hasImage(c) ? 35 : 0;
  const thinPenalty = count < 3 ? -120 : 0;
  const titleScore = isGoodTitle(c.title) ? 20 : 0;
  const recency = Math.min(Math.floor((toMs(c.updatedAt) || 0) / 1e11), 30);
  const variety = new Set((c.products || []).map((p) => p.productType || p.vendor || "unknown")).size;
  return count * 4 + imageScore + titleScore + recency + variety * 2 + thinPenalty;
}

function dominantValue(arr) {
  const map = new Map();
  for (const v of arr) {
    const key = String(v || "").trim();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  let best = "";
  let score = -1;
  for (const [k, v] of map.entries()) {
    if (v > score) {
      best = k;
      score = v;
    }
  }
  return best;
}

function collectionNameFromProducts(products, fallbackIndex) {
  const types = products.map((p) => p.productType);
  const tags = products.flatMap((p) => Array.isArray(p.tags) ? p.tags : []);
  const vendors = products.map((p) => p.vendor);
  const type = dominantValue(types);
  if (type) return `${type} Picks`;
  const tag = dominantValue(tags);
  if (tag) return `${tag} Collection`;
  const vendor = dominantValue(vendors);
  if (vendor) return `${vendor} Picks`;
  return `Featured Collection ${fallbackIndex}`;
}

function buildProductSimilaritySeed(collectionProducts) {
  const tags = new Set();
  const types = new Set();
  const vendors = new Set();
  for (const p of collectionProducts || []) {
    for (const t of p.tags || []) tags.add(String(t).toLowerCase());
    if (p.productType) types.add(String(p.productType).toLowerCase());
    if (p.vendor) vendors.add(String(p.vendor).toLowerCase());
  }
  return { tags, types, vendors };
}

function candidateScore(seed, p) {
  let s = 0;
  const pTags = (p.tags || []).map((t) => String(t).toLowerCase());
  for (const t of pTags) if (seed.tags.has(t)) s += 4;
  if (seed.types.has(String(p.productType || "").toLowerCase())) s += 6;
  if (seed.vendors.has(String(p.vendor || "").toLowerCase())) s += 3;
  return s;
}

function ratioDominant(values) {
  const total = values.length;
  if (!total) return 0;
  const counts = new Map();
  for (const v of values) {
    const key = String(v || "").trim().toLowerCase();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = 0;
  for (const v of counts.values()) best = Math.max(best, v);
  return best / total;
}

function clusterCohesion(products) {
  if (!Array.isArray(products) || products.length === 0) return 0;
  const types = products.map((p) => p.productType).filter(Boolean);
  const vendors = products.map((p) => p.vendor).filter(Boolean);
  const allTags = products.flatMap((p) => (Array.isArray(p.tags) ? p.tags : []));
  const typeRatio = ratioDominant(types);
  const vendorRatio = ratioDominant(vendors);
  const tagRatio = ratioDominant(allTags);
  return typeRatio * 0.5 + tagRatio * 0.35 + vendorRatio * 0.15;
}

function buildMeaningfulClusters(products) {
  const byType = new Map();
  for (const p of products) {
    const key = String(p.productType || "").trim();
    if (!key) continue;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push(p);
  }
  const byTag = new Map();
  for (const p of products) {
    for (const rawTag of p.tags || []) {
      const tag = String(rawTag || "").trim();
      if (!tag || tag.length < 3) continue;
      if (!byTag.has(tag)) byTag.set(tag, []);
      byTag.get(tag).push(p);
    }
  }

  const clusters = [];
  for (const items of byType.values()) {
    if (items.length >= MIN_CLUSTER_PRODUCTS) {
      clusters.push({ keyType: "type", items });
    }
  }
  for (const items of byTag.values()) {
    if (items.length >= MIN_CLUSTER_PRODUCTS + 1) {
      clusters.push({ keyType: "tag", items });
    }
  }

  return clusters
    .map((c) => ({
      ...c,
      cohesion: clusterCohesion(c.items),
    }))
    .filter((c) => c.cohesion >= MIN_CLUSTER_COHESION)
    .sort((a, b) => {
      if (b.cohesion !== a.cohesion) return b.cohesion - a.cohesion;
      return b.items.length - a.items.length;
    });
}

async function gql(admin, query, variables = {}) {
  const res = await admin.graphql(query, { variables });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || "GraphQL error");
  }
  return json.data;
}

async function fetchAllProducts(admin) {
  const all = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await gql(admin, PRODUCTS_PAGE_QUERY, cursor ? { cursor } : {});
    const conn = data?.products;
    all.push(...(conn?.nodes || []));
    hasNext = !!conn?.pageInfo?.hasNextPage;
    cursor = conn?.pageInfo?.endCursor || null;
  }
  return all;
}

async function fetchAllCollections(admin) {
  const all = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await gql(admin, COLLECTIONS_PAGE_QUERY, cursor ? { cursor } : {});
    const conn = data?.collections;
    for (const c of conn?.nodes || []) {
      all.push({
        id: c.id,
        legacyResourceId: c.legacyResourceId ?? null,
        title: c.title ?? "",
        handle: c.handle ?? "",
        description: c.description ?? "",
        updatedAt: c.updatedAt ?? null,
        sortOrder: c.sortOrder ?? null,
        collectionType: c.ruleSet ? "smart" : "manual",
        ruleSet: c.ruleSet || null,
        image: c.image ? { url: c.image.url, altText: c.image.altText ?? "" } : null,
        productCount: Number(c.productsCount?.count ?? c.products?.nodes?.length ?? 0),
        productsListedInSample: c.products?.nodes?.length || 0,
        productsTruncated: !!c.products?.pageInfo?.hasNextPage,
        products: c.products?.nodes || [],
      });
    }
    hasNext = !!conn?.pageInfo?.hasNextPage;
    cursor = conn?.pageInfo?.endCursor || null;
  }
  return all;
}

async function createCollection(admin, title, description) {
  const data = await gql(admin, COLLECTION_CREATE_MUTATION, {
    input: { title, descriptionHtml: `<p>${description}</p>` },
  });
  const payload = data?.collectionCreate;
  if (payload?.userErrors?.length) {
    throw new Error(payload.userErrors[0].message || "collectionCreate failed");
  }
  if (!payload?.collection?.id) {
    throw new Error("collectionCreate did not return collection id");
  }
  return payload.collection;
}

async function addProductsToCollection(admin, collectionId, productIds) {
  if (!collectionId || !Array.isArray(productIds) || productIds.length === 0) return;
  const data = await gql(admin, COLLECTION_ADD_PRODUCTS_MUTATION, {
    id: collectionId,
    productIds,
  });
  const userErrors = data?.collectionAddProducts?.userErrors || [];
  if (userErrors.length) {
    throw new Error(userErrors[0].message || "collectionAddProducts failed");
  }
}

function asOverviewPayload(collections) {
  const totalProductsAcrossCollections = collections.reduce(
    (sum, c) => sum + (typeof c.productCount === "number" ? c.productCount : 0),
    0,
  );
  return {
    totalCollections: collections.length,
    totalProductsAcrossCollections,
    fetchedAt: new Date().toISOString(),
    collections,
  };
}

async function runCollectionsAgent(admin) {
  const actions = [];
  const allProducts = await fetchAllProducts(admin);
  let collections = await fetchAllCollections(admin);

  if (allProducts.length === 0) {
    return {
      caseKey: "zero_products",
      actions,
      finalCollections: [
        { id: "placeholder-1", title: "Coming Soon", productCount: 0, placeholder: true, products: [] },
        { id: "placeholder-2", title: "Coming Soon", productCount: 0, placeholder: true, products: [] },
        { id: "placeholder-3", title: "Coming Soon", productCount: 0, placeholder: true, products: [] },
      ],
      collectionsOverview: asOverviewPayload(collections),
    };
  }

  const allProductsById = new Map(allProducts.map((p) => [p.id, p]));
  const assignedToAnyCollection = new Set(
    collections.flatMap((c) => (c.products || []).map((p) => p.id)).filter(Boolean),
  );

  const thinCollections = collections.filter((c) => Number(c.productCount || 0) < MIN_COLLECTION_PRODUCTS);
  for (const c of thinCollections) {
    const needed = MIN_COLLECTION_PRODUCTS - Number(c.productCount || 0);
    if (needed <= 0) continue;
    const seed = buildProductSimilaritySeed(c.products || []);
    if (seed.tags.size === 0 && seed.types.size === 0 && seed.vendors.size === 0) {
      actions.push({
        type: "backfill_skipped_no_seed",
        collectionId: c.id,
        collectionTitle: c.title,
      });
      continue;
    }
    const candidates = allProducts
      .filter((p) => !assignedToAnyCollection.has(p.id))
      .map((p) => ({ p, score: candidateScore(seed, p) }))
      .filter((x) => x.score >= MIN_BACKFILL_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, needed)
      .map((x) => x.p);
    if (!candidates.length) continue;
    try {
      await addProductsToCollection(admin, c.id, candidates.map((p) => p.id));
      c.products = [...(c.products || []), ...candidates];
      c.productCount = Number(c.productCount || 0) + candidates.length;
      c.updatedAt = new Date().toISOString();
      for (const p of candidates) assignedToAnyCollection.add(p.id);
      actions.push({
        type: "backfill_collection",
        collectionId: c.id,
        collectionTitle: c.title,
        addedProducts: candidates.length,
      });
    } catch (e) {
      actions.push({
        type: "backfill_failed",
        collectionId: c.id,
        collectionTitle: c.title,
        error: e.message,
      });
    }
  }

  let ranked = collections
    .filter((c) => Number(c.productCount || 0) >= MIN_COLLECTION_PRODUCTS)
    .sort((a, b) => scoreCollection(b) - scoreCollection(a));
  let selected = ranked.slice(0, 3);

  const usedIds = new Set(selected.map((c) => c.id));
  if (selected.length < 3) {
    const remainingProducts = allProducts.filter((p) => !assignedToAnyCollection.has(p.id));
    const sortedClusters = buildMeaningfulClusters(remainingProducts).map((c) => c.items);

    let createIndex = 1;
    for (const cluster of sortedClusters) {
      if (selected.length >= 3) break;
      const seed = cluster.slice(0, 10);
      const title = collectionNameFromProducts(seed, createIndex);
      const description = `Handpicked styles in ${title.replace(/ Picks$/, "")}.`;
      try {
        const created = await createCollection(admin, title, description);
        const productIds = cluster.slice(0, 12).map((p) => p.id);
        if (productIds.length < MIN_COLLECTION_PRODUCTS) {
          actions.push({
            type: "create_collection_skipped_low_quality",
            collectionTitle: title,
            reason: "not enough coherent products",
          });
          continue;
        }
        await addProductsToCollection(admin, created.id, productIds);
        const createdCollection = {
          id: created.id,
          title: created.title || title,
          handle: created.handle || "",
          description,
          updatedAt: created.updatedAt || new Date().toISOString(),
          collectionType: "manual",
          ruleSet: null,
          image: cluster[0]?.featuredImage?.url
            ? { url: cluster[0].featuredImage.url, altText: "" }
            : null,
          productCount: productIds.length,
          productsListedInSample: productIds.length,
          productsTruncated: false,
          products: productIds.map((id) => allProductsById.get(id)).filter(Boolean),
        };
        selected.push(createdCollection);
        usedIds.add(createdCollection.id);
        for (const id of productIds) assignedToAnyCollection.add(id);
        actions.push({
          type: "create_collection",
          collectionId: createdCollection.id,
          collectionTitle: createdCollection.title,
          productsAdded: productIds.length,
        });
        createIndex += 1;
      } catch (e) {
        actions.push({
          type: "create_collection_failed",
          collectionTitle: title,
          error: e.message,
        });
      }
    }
  }

  ranked = collections
    .filter((c) => Number(c.productCount || 0) >= MIN_COLLECTION_PRODUCTS && !usedIds.has(c.id))
    .sort((a, b) => scoreCollection(b) - scoreCollection(a));
  while (selected.length < 3 && ranked.length) selected.push(ranked.shift());

  while (selected.length < 3) {
    selected.push({
      id: `placeholder-${selected.length + 1}`,
      title: "Needs Curation",
      productCount: 0,
      placeholder: true,
      products: [],
      note: "Not enough coherent products to auto-build this collection confidently.",
    });
  }

  return {
    caseKey: collections.length === 0 ? "zero_collections" : "mixed",
    actions,
    finalCollections: selected.slice(0, 3),
    collectionsOverview: asOverviewPayload(await fetchAllCollections(admin)),
  };
}

/**
 * GET: collection insight
 * POST: run decision-tree collections agent and return 3 final collections
 */
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const collections = await fetchAllCollections(admin);
    return new Response(
      JSON.stringify({ success: true, ...asOverviewPayload(collections) }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const result = await runCollectionsAgent(admin);
    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
