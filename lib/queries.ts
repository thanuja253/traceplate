import { CYPHER } from "./cypher";
import { DatabaseUnavailableError, num, readQuery, verifyConnection } from "./neo4j";
import type {
  Counts,
  GraphEdge,
  GraphNode,
  KitchenDetail,
  RecallDetail,
  RecallSummary,
  RiskKitchen,
  SearchHit,
  SharedSource,
} from "./types";

const EMPTY_COUNTS: Counts = {
  farms: 0,
  processors: 0,
  distributors: 0,
  restaurants: 0,
  dishes: 0,
  ingredients: 0,
  recalls: 0,
  cities: 0,
  relationships: 0,
};

function labelToCountKey(label: string): keyof Omit<Counts, "relationships"> | null {
  switch (label) {
    case "Farm":
      return "farms";
    case "Processor":
      return "processors";
    case "Distributor":
      return "distributors";
    case "Restaurant":
      return "restaurants";
    case "Dish":
      return "dishes";
    case "Ingredient":
      return "ingredients";
    case "Recall":
      return "recalls";
    case "City":
      return "cities";
    default:
      return null;
  }
}

function asRecall(row: Record<string, unknown>): RecallSummary {
  return {
    id: String(row.id),
    title: String(row.title),
    contaminant: String(row.contaminant),
    severity: row.severity as RecallSummary["severity"],
    date: String(row.date),
    status: row.status as RecallSummary["status"],
    summary: String(row.summary),
    originId: String(row.originId),
    originName: String(row.originName),
    originKind: String(row.originKind),
    originRegion: String(row.originRegion ?? ""),
    restaurantsAtRisk: num(row.restaurantsAtRisk),
    citiesAtRisk: num(row.citiesAtRisk),
  };
}

function asEdge(row: Record<string, unknown>): GraphEdge {
  return {
    fromId: String(row.fromId),
    fromName: String(row.fromName),
    fromKind: String(row.fromKind),
    toId: String(row.toId),
    toName: String(row.toName),
    toKind: String(row.toKind),
    rel: String(row.rel),
  };
}

export async function getOverview(): Promise<{
  counts: Counts;
  recalls: RecallSummary[];
}> {
  const [labelRows, relRows, recalls] = await Promise.all([
    readQuery<{ label: string; c: number }>(CYPHER.counts),
    readQuery<{ relationships: number }>(CYPHER.relationshipCount),
    readQuery<Record<string, unknown>>(CYPHER.recallCards),
  ]);

  const counts: Counts = { ...EMPTY_COUNTS };
  for (const row of labelRows) {
    const key = labelToCountKey(row.label);
    if (key) counts[key] = num(row.c);
  }
  counts.relationships = num(relRows[0]?.relationships);

  return { counts, recalls: recalls.map(asRecall) };
}

export async function getRecall(id: string): Promise<RecallDetail | null> {
  const [meta, edgeRows, kitchenRows] = await Promise.all([
    readQuery<Record<string, unknown>>(CYPHER.recallById, { id }),
    readQuery<Record<string, unknown>>(CYPHER.blastRadiusEdges, { id }),
    readQuery<Record<string, unknown>>(CYPHER.blastRadiusKitchens, { id }),
  ]);

  if (!meta[0]) return null;
  const recall = asRecall(meta[0]);
  const edges = edgeRows.map(asEdge);

  const processors = uniqueNodes(edges, "Processor");
  const distributors = uniqueNodes(edges, "Distributor");

  const origin: GraphNode = {
    id: recall.originId,
    name: recall.originName,
    kind: recall.originKind,
    city: String(meta[0].originCity ?? ""),
    state: String(meta[0].originState ?? ""),
    extra: recall.originRegion,
  };

  const kitchens: RiskKitchen[] = kitchenRows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    city: String(row.city),
    state: String(row.state),
    cuisine: String(row.cuisine),
    hops: num(row.hops),
    dishes: Array.isArray(row.dishes) ? (row.dishes as string[]).filter(Boolean) : [],
    ingredients: Array.isArray(row.ingredients)
      ? (row.ingredients as string[]).filter(Boolean)
      : [],
  }));

  return { recall, origin, edges, kitchens, processors, distributors };
}

export async function getKitchen(id: string): Promise<KitchenDetail | null> {
  const [meta, dishRows, upstream, paths] = await Promise.all([
    readQuery<Record<string, unknown>>(CYPHER.kitchenById, { id }),
    readQuery<Record<string, unknown>>(CYPHER.kitchenDishes, { id }),
    readQuery<Record<string, unknown>>(CYPHER.kitchenUpstream, { id }),
    readQuery<Record<string, unknown>>(CYPHER.kitchenRecallPaths, { id }),
  ]);

  if (!meta[0]) return null;
  const row = meta[0];
  const dishes = dishRows.map((d) => ({
    id: String(d.id),
    name: String(d.name),
    course: String(d.course),
    ingredients: Array.isArray(d.ingredients)
      ? (d.ingredients as string[]).filter(Boolean)
      : [],
  }));

  return {
    id: String(row.id),
    name: String(row.name),
    city: String(row.city),
    state: String(row.state),
    cuisine: String(row.cuisine),
    neighborhood: String(row.neighborhood ?? ""),
    dishes,
    upstream: upstream.map(asEdge),
    pathToRecalls: paths.map((p) => ({
      recallId: String(p.recallId),
      recallTitle: String(p.recallTitle),
      contaminant: String(p.contaminant),
      hops: num(p.hops),
      via: Array.isArray(p.via) ? (p.via as string[]) : [],
    })),
  };
}

export async function listKitchens() {
  return readQuery<{
    id: string;
    name: string;
    city: string;
    state: string;
    cuisine: string;
  }>(CYPHER.kitchenList);
}

export async function getSharedSources(idA: string, idB: string): Promise<SharedSource[]> {
  const rows = await readQuery<Record<string, unknown>>(CYPHER.sharedSources, { idA, idB });
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    kind: String(row.kind),
    region: String(row.region ?? ""),
    hopsToA: num(row.hopsToA),
    hopsToB: num(row.hopsToB),
  }));
}

export async function searchGraph(q: string): Promise<SearchHit[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const rows = await readQuery<Record<string, unknown>>(CYPHER.search, { q: trimmed });
  return rows.map((row) => {
    const kind = String(row.kind);
    const id = String(row.id);
    const href =
      kind === "Restaurant"
        ? `/kitchens/${id}`
        : kind === "Recall"
          ? `/recalls/${id}`
          : `/search?q=${encodeURIComponent(String(row.name))}`;
    return {
      id,
      name: String(row.name),
      kind,
      subtitle: String(row.subtitle ?? ""),
      href,
    };
  });
}

export async function healthcheck(): Promise<
  | { ok: true; address: string }
  | { ok: false; error: string }
> {
  try {
    const info = await verifyConnection();
    await readQuery(CYPHER.ping);
    return info;
  } catch (err) {
    const message =
      err instanceof DatabaseUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown database error";
    return { ok: false, error: message };
  }
}

function uniqueNodes(edges: GraphEdge[], kind: string): GraphNode[] {
  const map = new Map<string, GraphNode>();
  for (const e of edges) {
    if (e.fromKind === kind) {
      map.set(e.fromId, { id: e.fromId, name: e.fromName, kind: e.fromKind });
    }
    if (e.toKind === kind) {
      map.set(e.toId, { id: e.toId, name: e.toName, kind: e.toKind });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
