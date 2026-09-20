export function pick<T>(record: Record<string, T>, key: string, fallback: T): T {
  return (key in record ? record[key] : fallback) ?? fallback;
}