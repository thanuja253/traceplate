import neo4j, { type Driver, type Record as Neo4jRecord } from "neo4j-driver";
import { getCognoConfig } from "./config";

const globalForDriver = globalThis as unknown as { cognodbDriver?: Driver };

export class DatabaseUnavailableError extends Error {
  constructor(message = "CognoDB is unreachable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function getDriver(): Driver {
  if (!globalForDriver.cognodbDriver) {
    const { uri, username, password } = getCognoConfig();
    globalForDriver.cognodbDriver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionPoolSize: 8,
        connectionAcquisitionTimeout: 10_000,
        connectionTimeout: 8_000,
      },
    );
  }
  return globalForDriver.cognodbDriver;
}

export function isInt(value: unknown): value is { toNumber: () => number } {
  return neo4j.isInt(value);
}

export function num(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (isInt(value)) return value.toNumber();
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function wrapError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";

  const unreachable =
    /Failed to connect|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ServiceUnavailable|SessionExpired|N\/A|certificate|TLS|SSL|unauthorized/i.test(
      message,
    ) || /ServiceUnavailable|SessionExpired/.test(code);

  if (unreachable) {
    return new DatabaseUnavailableError(
      "Could not reach CognoDB. Check COGNODB_URI / COGNODB_PASSWORD and that your instance is running.",
    );
  }
  return err instanceof Error ? err : new Error(message);
}

export async function readQuery<T extends Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  try {
    const { records } = await getDriver().executeQuery(cypher, params);
    return records.map((record) => hydrate(record) as T);
  } catch (err) {
    throw wrapError(err);
  }
}

export async function writeQuery<T extends Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  try {
    const { records } = await getDriver().executeQuery(cypher, params);
    return records.map((record) => hydrate(record) as T);
  } catch (err) {
    throw wrapError(err);
  }
}

export async function verifyConnection(): Promise<{
  ok: true;
  address: string;
}> {
  try {
    const info = await getDriver().getServerInfo();
    return { ok: true, address: info.address ?? "cognodb" };
  } catch (err) {
    throw wrapError(err);
  }
}

function hydrate(record: Neo4jRecord): Record<string, unknown> {
  const obj = record.toObject();
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = coerce(value);
  }
  return out;
}

function coerce(value: unknown): unknown {
  if (value == null) return value;
  if (isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(coerce);
  if (typeof value === "object") {
    const maybe = value as { properties?: Record<string, unknown> };
    if (maybe.properties && typeof maybe.properties === "object") {
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(maybe.properties)) {
        props[k] = coerce(v);
      }
      return props;
    }
  }
  return value;
}
