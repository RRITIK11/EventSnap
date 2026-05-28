ALTER TABLE "events" ALTER COLUMN "storage_used_bytes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "storage_limit_bytes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "size_bytes" SET DATA TYPE bigint;