export type Severity = "watch" | "advisory" | "outbreak";
export type RecallStatus = "active" | "contained";

export type Counts = {
  farms: number;
  processors: number;
  distributors: number;
  restaurants: number;
  dishes: number;
  ingredients: number;
  recalls: number;
  cities: number;
  relationships: number;
};

export type RecallSummary = {
  id: string;
  title: string;
  contaminant: string;
  severity: Severity;
  date: string;
  status: RecallStatus;
  summary: string;
  originId: string;
  originName: string;
  originKind: string;
  originRegion: string;
  restaurantsAtRisk: number;
  citiesAtRisk: number;
};

export type GraphNode = {
  id: string;
  name: string;
  kind: string;
  city?: string;
  state?: string;
  extra?: string;
};

export type GraphEdge = {
  fromId: string;
  fromName: string;
  fromKind: string;
  toId: string;
  toName: string;
  toKind: string;
  rel: string;
};

export type RiskKitchen = {
  id: string;
  name: string;
  city: string;
  state: string;
  cuisine: string;
  hops: number;
  dishes: string[];
  ingredients: string[];
};

export type RecallDetail = {
  recall: RecallSummary;
  origin: GraphNode;
  edges: GraphEdge[];
  kitchens: RiskKitchen[];
  processors: GraphNode[];
  distributors: GraphNode[];
};

export type KitchenDetail = {
  id: string;
  name: string;
  city: string;
  state: string;
  cuisine: string;
  neighborhood: string;
  dishes: { id: string; name: string; course: string; ingredients: string[] }[];
  upstream: GraphEdge[];
  pathToRecalls: {
    recallId: string;
    recallTitle: string;
    contaminant: string;
    hops: number;
    via: string[];
  }[];
};

export type SharedSource = {
  id: string;
  name: string;
  kind: string;
  region: string;
  hopsToA: number;
  hopsToB: number;
};

export type SearchHit = {
  id: string;
  name: string;
  kind: string;
  subtitle: string;
  href: string;
};
