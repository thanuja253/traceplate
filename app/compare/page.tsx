import { CompareClient } from "@/components/CompareClient";
import { DatabaseDown } from "@/components/States";
import { listKitchens } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  try {
    const kitchens = await listKitchens();
    return (
      <main>
        <div className="page-head">
          <p className="kicker">Find a common supplier</p>
          <h1>Two restaurants, one shared source.</h1>
          <p className="lede">
            If Cafe Madras in Mumbai and Indian Accent in Delhi both made people sick,
            which farm or packer supplies both? That question is hard in a spreadsheet
            and natural in a graph.
          </p>
        </div>
        <CompareClient kitchens={kitchens} />
      </main>
    );
  } catch (err) {
    return (
      <main>
        <div className="page-head">
          <h1>Two restaurants, one shared source.</h1>
        </div>
        <DatabaseDown message={err instanceof Error ? err.message : undefined} />
      </main>
    );
  }
}
