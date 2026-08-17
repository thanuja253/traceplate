function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and paste your CognoDB credentials.`,
    );
  }
  return value;
}

export function getCognoConfig() {
  return {
    uri: required("COGNODB_URI"),
    username: process.env.COGNODB_USERNAME || "cognodb",
    password: required("COGNODB_PASSWORD"),
  };
}
