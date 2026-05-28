import { customType } from "drizzle-orm/pg-core";

/**
 * pgvector column type for Drizzle. Stores a fixed-dimension float vector.
 *
 * Usage:
 *   face_embedding: vector("face_embedding", 512)
 *
 * Drizzle-kit will generate `vector(512)` in the migration. The HNSW index
 * is added by hand in the migration SQL (see migrations/README.md).
 */
export const vector = (name: string, dims: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dims})`,
    toDriver: (value: number[]) => `[${value.join(",")}]`,
    fromDriver: (value: string) => {
      const trimmed = value.startsWith("[") ? value.slice(1, -1) : value;
      return trimmed.split(",").map(Number);
    },
  })(name);
