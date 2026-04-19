import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { PRICE_FILTER_TO_INTS } from "../utils/priceRange.js";
import { paginate, paginationMeta } from "../utils/pagination.js";

const authorSelect = { user_id: true, name: true };

function buildWhereParts(q) {
  const parts = [];
  if (q.type) {
    parts.push(Prisma.sql`r.type::text = ${q.type}`);
    //parts.push(Prisma.sql`LOWER(r.type::text) = LOWER(${q.type})`);
  }
  if (q.search?.trim()) {
    const term = `%${q.search.trim()}%`;
    parts.push(
      Prisma.sql`(r.title ILIKE ${term} OR r.description ILIKE ${term})`
    );
  }
  if (q.price) {
    const ints = PRICE_FILTER_TO_INTS[q.price];
    parts.push(Prisma.sql`r.price_range IN (${Prisma.join(ints)})`);
  }
  if (q.rating === "high") {
    parts.push(Prisma.sql`r.recommendation_id IN (
      SELECT recommendation_id FROM (
        SELECT recommendation_id,
          AVG((price_rating + quality_rating + safety_rating) / 3.0) AS avg_score
        FROM ratings
        GROUP BY recommendation_id
      ) x WHERE avg_score >= 4.0
    )`);
  } else if (q.rating === "mid") {
    parts.push(Prisma.sql`r.recommendation_id IN (
      SELECT recommendation_id FROM (
        SELECT recommendation_id,
          AVG((price_rating + quality_rating + safety_rating) / 3.0) AS avg_score
        FROM ratings
        GROUP BY recommendation_id
      ) x WHERE avg_score >= 2.5 AND avg_score < 4.0
    )`);
  } else if (q.rating === "low") {
    parts.push(Prisma.sql`r.recommendation_id IN (
      SELECT recommendation_id FROM (
        SELECT recommendation_id,
          AVG((price_rating + quality_rating + safety_rating) / 3.0) AS avg_score
        FROM ratings
        GROUP BY recommendation_id
      ) x WHERE avg_score < 2.5
    )`);
  }
  return parts;
}

function whereSqlFromParts(parts) {
  if (!parts.length) return Prisma.sql`TRUE`;
  return Prisma.join(parts, Prisma.sql` AND `);
}

const ORDER_FRAGMENTS = {
  rating: Prisma.sql`ORDER BY agg.avg_score DESC NULLS LAST, r.created_at DESC`,
  price_asc: Prisma.sql`ORDER BY r.price_range ASC NULLS LAST, r.created_at DESC`,
  price_desc: Prisma.sql`ORDER BY r.price_range DESC NULLS LAST, r.created_at DESC`,
  created_at: Prisma.sql`ORDER BY r.created_at DESC`,
};

export async function create(req, res) {
  const {
    title,
    description,
    location,
    image_urls,
    image_url,
    type,
    price_range,
    best_time_to_visit,
    safety_description,
  } = req.body;

  const normalizedImageUrls = Array.isArray(image_urls)
    ? image_urls
    : image_url
      ? [image_url]
      : [];

  const data = {
    title,
    description,
    ...(location !== undefined && { location }),
    ...(normalizedImageUrls.length > 0 && { image_urls: normalizedImageUrls }),
    type,
    created_by: req.user.user_id,
    ...(price_range !== undefined && { price_range }),
    ...(best_time_to_visit !== undefined && { best_time_to_visit }),
    ...(safety_description !== undefined && { safety_description }),
  };

  const row = await prisma.recommendation.create({
    data,
    include: { author: { select: authorSelect } },
  });

  res.status(201).json({ recommendation: row });
}

export async function getAll(req, res) {
  const q = req.validatedQuery;
  const { page, limit, skip, take } = paginate(q.page, q.limit);
  const sortKey = q.sort ?? "created_at";
  const orderFrag = ORDER_FRAGMENTS[sortKey] ?? ORDER_FRAGMENTS.created_at;

  const parts = buildWhereParts(q);
  const whereSql = whereSqlFromParts(parts);

  const idRows = await prisma.$queryRaw`
    SELECT r.recommendation_id
    FROM recommendations r
    LEFT JOIN (
      SELECT recommendation_id,
        AVG((price_rating + quality_rating + safety_rating) / 3.0) AS avg_score
      FROM ratings
      GROUP BY recommendation_id
    ) agg ON agg.recommendation_id = r.recommendation_id
    WHERE ${whereSql}
    ${orderFrag}
    LIMIT ${take} OFFSET ${skip}
  `;

  const countRows = await prisma.$queryRaw`
    SELECT COUNT(*)::bigint AS c
    FROM recommendations r
    LEFT JOIN (
      SELECT recommendation_id,
        AVG((price_rating + quality_rating + safety_rating) / 3.0) AS avg_score
      FROM ratings
      GROUP BY recommendation_id
    ) agg ON agg.recommendation_id = r.recommendation_id
    WHERE ${whereSql}
  `;

  const total = Number(countRows[0]?.c ?? 0);
  const ids = idRows.map((r) => r.recommendation_id);

  if (ids.length === 0) {
    return res.json({
      data: [],
      pagination: paginationMeta(total, page, limit),
    });
  }

  const recs = await prisma.recommendation.findMany({
    where: { recommendation_id: { in: ids } },
    include: { author: { select: authorSelect } },
  });

  const orderMap = new Map(ids.map((id, i) => [id, i]));
  recs.sort(
    (a, b) =>
      (orderMap.get(a.recommendation_id) ?? 0) -
      (orderMap.get(b.recommendation_id) ?? 0)
  );

  res.json({
    data: recs,
    pagination: paginationMeta(total, page, limit),
  });
}

export async function getOne(req, res) {
  const { id } = req.params;

  const rec = await prisma.recommendation.findUnique({
    where: { recommendation_id: id },
    include: {
      author: { select: authorSelect },
      ratings: {
        orderBy: { created_at: "desc" },
        take: 20,
      },
      comments: {
        orderBy: { created_at: "desc" },
        take: 20,
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!rec) {
    return res.status(404).json({ message: "Recommendation not found" });
  }

  const voteGroups = await prisma.vote.groupBy({
    by: ["vote_type"],
    where: { recommendation_id: id },
    _count: { vote_id: true },
  });

  const votesByType = { upvote: 0, downvote: 0 };
  for (const row of voteGroups) {
    votesByType[row.vote_type] = row._count.vote_id;
  }

  let viewerVoteType = null;
  if (req.user?.user_id) {
    const v = await prisma.vote.findUnique({
      where: {
        user_id_recommendation_id: {
          user_id: req.user.user_id,
          recommendation_id: id,
        },
      },
      select: { vote_type: true },
    });
    viewerVoteType = v?.vote_type ?? null;
  }

  const comments = rec.comments.map((c) => ({
    comment_id: c.comment_id,
    user_id: c.is_anonymous ? null : c.user_id,
    recommendation_id: c.recommendation_id,
    comment_text: c.comment_text,
    is_anonymous: c.is_anonymous,
    created_at: c.created_at,
    updated_at: c.updated_at,
    author_name: c.is_anonymous ? null : (c.user?.name ?? null),
  }));

  const base = {
    ...rec,
    comments,
  };

  res.json({
    recommendation: {
      ...base,
      ratings: rec.ratings,
      comments,
      votes: votesByType,
      viewer_vote_type: viewerVoteType,
    },
  });
}

export async function update(req, res) {
  const { id } = req.params;
  const body = req.body;

  const existing = await prisma.recommendation.findUnique({
    where: { recommendation_id: id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Recommendation not found" });
  }

  if (existing.created_by !== req.user.user_id) {
    return res
      .status(403)
      .json({ message: "Not allowed to modify this recommendation" });
  }

  const data = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.location !== undefined) data.location = body.location;
  if (body.image_urls !== undefined || body.image_url !== undefined) {
    data.image_urls = Array.isArray(body.image_urls)
      ? body.image_urls
      : body.image_url
        ? [body.image_url]
        : [];
  }
  if (body.type !== undefined) data.type = body.type;
  if (body.price_range !== undefined) {
    data.price_range = body.price_range;
  }
  if (body.best_time_to_visit !== undefined) {
    data.best_time_to_visit = body.best_time_to_visit;
  }
  if (body.safety_description !== undefined) {
    data.safety_description = body.safety_description;
  }

  const row = await prisma.recommendation.update({
    where: { recommendation_id: id },
    data,
    include: { author: { select: authorSelect } },
  });

  res.json({ recommendation: row });
}

export async function remove(req, res) {
  const { id } = req.params;

  const existing = await prisma.recommendation.findUnique({
    where: { recommendation_id: id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Recommendation not found" });
  }

  if (existing.created_by !== req.user.user_id) {
    return res
      .status(403)
      .json({ message: "Not allowed to delete this recommendation" });
  }

  await prisma.recommendation.delete({
    where: { recommendation_id: id },
  });

  res.json({ message: "Recommendation deleted" });
}

export async function getTrending(req, res) {
  const rows = await prisma.$queryRaw`
    SELECT
      r.recommendation_id,
      (
        COALESCE(u.upvotes, 0) * 2
        + COALESCE(rc.rating_cnt, 0) * 3
        + COALESCE(cc.comment_cnt, 0) * 1
      )::float AS trending_score
    FROM recommendations r
    LEFT JOIN (
      SELECT recommendation_id, COUNT(*)::int AS upvotes
      FROM votes
      WHERE vote_type = 'upvote'
      GROUP BY recommendation_id
    ) u ON u.recommendation_id = r.recommendation_id
    LEFT JOIN (
      SELECT recommendation_id, COUNT(*)::int AS rating_cnt
      FROM ratings
      GROUP BY recommendation_id
    ) rc ON rc.recommendation_id = r.recommendation_id
    LEFT JOIN (
      SELECT recommendation_id, COUNT(*)::int AS comment_cnt
      FROM comments
      GROUP BY recommendation_id
    ) cc ON cc.recommendation_id = r.recommendation_id
    ORDER BY trending_score DESC
    LIMIT 10
  `;

  const ids = rows.map((r) => r.recommendation_id);
  const scoreById = new Map(
    rows.map((r) => [r.recommendation_id, Number(r.trending_score)])
  );

  if (ids.length === 0) {
    return res.json({ data: [] });
  }

  const recs = await prisma.recommendation.findMany({
    where: { recommendation_id: { in: ids } },
    include: { author: { select: authorSelect } },
  });

  const orderMap = new Map(ids.map((rid, i) => [rid, i]));
  recs.sort(
    (a, b) =>
      (orderMap.get(a.recommendation_id) ?? 0) -
      (orderMap.get(b.recommendation_id) ?? 0)
  );

  const data = recs.map((r) => ({
    ...r,
    trending_score: scoreById.get(r.recommendation_id) ?? 0,
  }));

  res.json({ data });
}
