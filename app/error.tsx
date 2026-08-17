"use client";

import { DatabaseDown } from "@/components/States";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <DatabaseDown message={error.message} />
      <button className="btn" onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
