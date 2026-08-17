/**
 * All Cypher lives here — parameterised, never concatenated.
 * Each query is written so a reviewer can read the intent in the pattern itself.
 */

export const CYPHER = {
  counts: `
    MATCH (n)
    WITH labels(n)[0] AS label, count(*) AS c
    RETURN label, c
  `,

  relationshipCount: `
    MATCH ()-[r]->()
    RETURN count(r) AS relationships
  `,

  ping: `
    RETURN 1 AS ok
  `,

  recallCards: `
    MATCH (recall:Recall)-[:FLAGS]->(origin)
    OPTIONAL MATCH (origin)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(kitchen:Restaurant)
    OPTIONAL MATCH (kitchen)-[:LOCATED_IN]->(city:City)
    RETURN
      recall.id AS id,
      recall.title AS title,
      recall.contaminant AS contaminant,
      recall.severity AS severity,
      recall.date AS date,
      recall.status AS status,
      recall.summary AS summary,
      origin.id AS originId,
      origin.name AS originName,
      labels(origin)[0] AS originKind,
      coalesce(origin.region, origin.state, "") AS originRegion,
      count(DISTINCT kitchen) AS restaurantsAtRisk,
      count(DISTINCT city) AS citiesAtRisk
    ORDER BY recall.date DESC
  `,

  recallById: `
    MATCH (recall:Recall {id: $id})-[:FLAGS]->(origin)
    OPTIONAL MATCH (origin)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(kitchen:Restaurant)
    OPTIONAL MATCH (kitchen)-[:LOCATED_IN]->(city:City)
    RETURN
      recall.id AS id,
      recall.title AS title,
      recall.contaminant AS contaminant,
      recall.severity AS severity,
      recall.date AS date,
      recall.status AS status,
      recall.summary AS summary,
      origin.id AS originId,
      origin.name AS originName,
      labels(origin)[0] AS originKind,
      coalesce(origin.region, origin.state, "") AS originRegion,
      origin.city AS originCity,
      origin.state AS originState,
      count(DISTINCT kitchen) AS restaurantsAtRisk,
      count(DISTINCT city) AS citiesAtRisk
  `,

  /**
   * Multi-hop (2–6) blast radius: walk the physical food path from the
   * flagged origin through packers and distributors to kitchens.
   * Also attach menu items that contain ingredients grown/packed at origin.
   */
  blastRadiusEdges: `
    MATCH (recall:Recall {id: $id})-[:FLAGS]->(origin)
    MATCH path = (origin)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(:Restaurant)
    UNWIND relationships(path) AS rel
    WITH origin, startNode(rel) AS a, endNode(rel) AS b, type(rel) AS relType
    RETURN DISTINCT
      origin.id AS originId,
      origin.name AS originName,
      labels(origin)[0] AS originKind,
      a.id AS fromId,
      a.name AS fromName,
      labels(a)[0] AS fromKind,
      coalesce(a.city, a.region, "") AS fromCity,
      coalesce(a.state, "") AS fromState,
      b.id AS toId,
      b.name AS toName,
      labels(b)[0] AS toKind,
      coalesce(b.city, b.region, "") AS toCity,
      coalesce(b.state, "") AS toState,
      relType AS rel
  `,

  blastRadiusKitchens: `
    MATCH (recall:Recall {id: $id})-[:FLAGS]->(origin)
    MATCH path = (origin)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(kitchen:Restaurant)
    WITH origin, kitchen, min(length(path)) AS hops
    OPTIONAL MATCH (origin)-[:GROWS|PACKS]->(ing:Ingredient)
    OPTIONAL MATCH (kitchen)-[:SERVES]->(dish:Dish)-[:CONTAINS]->(ing)
    RETURN
      kitchen.id AS id,
      kitchen.name AS name,
      kitchen.city AS city,
      kitchen.state AS state,
      kitchen.cuisine AS cuisine,
      hops,
      collect(DISTINCT dish.name) AS dishes,
      collect(DISTINCT ing.name) AS ingredients
    ORDER BY hops ASC, kitchen.city ASC, kitchen.name ASC
  `,

  kitchenById: `
    MATCH (kitchen:Restaurant {id: $id})
    RETURN
      kitchen.id AS id,
      kitchen.name AS name,
      kitchen.city AS city,
      kitchen.state AS state,
      kitchen.cuisine AS cuisine,
      kitchen.neighborhood AS neighborhood
  `,

  kitchenDishes: `
    MATCH (kitchen:Restaurant {id: $id})-[:SERVES]->(dish:Dish)
    OPTIONAL MATCH (dish)-[:CONTAINS]->(ing:Ingredient)
    RETURN
      dish.id AS id,
      dish.name AS name,
      dish.course AS course,
      collect(DISTINCT ing.name) AS ingredients
    ORDER BY dish.course ASC, dish.name ASC
  `,

  kitchenUpstream: `
    MATCH (kitchen:Restaurant {id: $id})
    MATCH path = (source)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(kitchen)
    WHERE source:Farm OR source:Processor OR source:Distributor
    UNWIND relationships(path) AS rel
    WITH startNode(rel) AS a, endNode(rel) AS b, type(rel) AS relType
    RETURN DISTINCT
      a.id AS fromId,
      a.name AS fromName,
      labels(a)[0] AS fromKind,
      coalesce(a.city, a.region, "") AS fromCity,
      coalesce(a.state, "") AS fromState,
      b.id AS toId,
      b.name AS toName,
      labels(b)[0] AS toKind,
      coalesce(b.city, b.region, "") AS toCity,
      coalesce(b.state, "") AS toState,
      relType AS rel
  `,

  /**
   * Multi-hop from a kitchen back to any flagged recall origin.
   * Picks the shortest variable-length path without shortestPath(),
   * which is not part of openCypher.
   */
  kitchenRecallPaths: `
    MATCH (kitchen:Restaurant {id: $id})
    MATCH (recall:Recall)-[:FLAGS]->(origin)
    MATCH path = (origin)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(kitchen)
    WITH recall, path, length(path) AS hops
    ORDER BY recall.id, hops
    WITH recall, head(collect(path)) AS shortest, min(hops) AS hops
    RETURN
      recall.id AS recallId,
      recall.title AS recallTitle,
      recall.contaminant AS contaminant,
      hops,
      [n IN nodes(shortest) | n.name] AS via
    ORDER BY hops ASC
  `,

  /**
   * The "awkward for SQL" query: common ancestors at variable depth.
   * Two kitchens, every upstream Farm/Processor/Distributor that can
   * reach BOTH, with hop distance to each. In SQL this is two recursive
   * CTEs over a union of typed tables, then a join on ancestor id.
   */
  sharedSources: `
    MATCH (a:Restaurant {id: $idA})
    MATCH (b:Restaurant {id: $idB})
    MATCH pathA = (source)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(a)
    MATCH pathB = (source)-[:SUPPLIES|SHIPS_TO|DELIVERS_TO*1..6]->(b)
    WHERE a <> b AND (source:Farm OR source:Processor OR source:Distributor)
    WITH source,
         labels(source)[0] AS kind,
         min(length(pathA)) AS hopsToA,
         min(length(pathB)) AS hopsToB
    RETURN
      source.id AS id,
      source.name AS name,
      kind,
      coalesce(source.region, source.city, "") AS region,
      hopsToA,
      hopsToB,
      hopsToA + hopsToB AS totalHops
    ORDER BY totalHops ASC, kind ASC, name ASC
  `,

  kitchenList: `
    MATCH (k:Restaurant)
    RETURN k.id AS id, k.name AS name, k.city AS city, k.state AS state, k.cuisine AS cuisine
    ORDER BY k.city ASC, k.name ASC
  `,

  search: `
    MATCH (n)
    WHERE (n:Restaurant OR n:Farm OR n:Processor OR n:Distributor OR n:Recall OR n:Ingredient)
      AND toLower(n.name) CONTAINS toLower($q)
    RETURN
      n.id AS id,
      n.name AS name,
      labels(n)[0] AS kind,
      coalesce(n.city, n.region, n.contaminant, n.category, "") AS subtitle
    ORDER BY kind ASC, name ASC
    LIMIT 12
  `,
} as const;
