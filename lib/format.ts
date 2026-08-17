export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function hopLabel(n: number): string {
  return n === 1 ? "1 step" : `${n} steps`;
}

export function stampLabel(value: string): string {
  switch (value) {
    case "outbreak":
      return "Alert";
    case "advisory":
      return "Warning";
    case "watch":
      return "Watch";
    case "contained":
      return "Closed";
    default:
      return value;
  }
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case "Farm":
      return "Farm";
    case "Processor":
      return "Packer";
    case "Distributor":
      return "Distributor";
    case "Restaurant":
      return "Kitchen";
    case "Ingredient":
      return "Ingredient";
    case "Recall":
      return "Recall";
    default:
      return kind;
  }
}
