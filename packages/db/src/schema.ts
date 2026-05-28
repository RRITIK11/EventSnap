import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { vector } from "./vector";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const eventRole = pgEnum("event_role", ["owner", "photographer", "guest"]);
export const photoStatus = pgEnum("photo_status", [
  "pending",
  "ready",
  "hidden",
  "reported",
  "deleted",
]);
export const approvalStatus = pgEnum("approval_status", ["pending", "approved", "hidden"]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").unique(),
    email: text("email").unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    name: text("name"),
    image: text("image"),
    passwordHash: text("password_hash"),
    selfieUrl: text("selfie_url"),
    faceEmbedding: vector("face_embedding", 512),
    autoApprove: boolean("auto_approve").notNull().default(false),
    consentVersion: integer("consent_version").notNull().default(1),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_phone_uq").on(t.phone),
    uniqueIndex("users_email_uq").on(t.email),
    // NOTE: HNSW index on face_embedding added by hand in migration SQL.
  ],
);

// ─── Auth.js (next-auth v5) adapter tables ─────────────────────────────────
// JWT sessions are used (no sessions table). Accounts links OAuth providers
// to our users; verification_tokens supports email magic links if we add them.

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("accounts_user_idx").on(t.userId),
  ],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    qrToken: text("qr_token").notNull().unique(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    uploadPolicy: jsonb("upload_policy_json")
      .notNull()
      .default(sql`'{"who":"members"}'::jsonb`),
    storageUsedBytes: integer("storage_used_bytes").notNull().default(0),
    storageLimitBytes: integer("storage_limit_bytes").notNull().default(5_000_000_000), // 5 GB
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_owner_idx").on(t.ownerId)],
);

export const eventMembers = pgTable(
  "event_members",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: eventRole("role").notNull().default("guest"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.userId] }),
    index("event_members_user_idx").on(t.userId),
  ],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    storageKey: text("storage_key").notNull().unique(),
    thumbnailKey: text("thumbnail_key"),
    exifStripped: boolean("exif_stripped").notNull().default(false),
    status: photoStatus("status").notNull().default("pending"),
    sizeBytes: integer("size_bytes"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("photos_event_timeline_idx").on(t.eventId, t.uploadedAt.desc())],
);

export const photoFaces = pgTable(
  "photo_faces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    faceIndex: integer("face_index").notNull(),
    bbox: jsonb("bbox_json").notNull(),
    embedding: vector("embedding", 512).notNull(),
    matchedUserId: uuid("matched_user_id").references(() => users.id, { onDelete: "set null" }),
    matchDistance: real("match_distance"),
  },
  (t) => [
    uniqueIndex("photo_faces_photo_index_uq").on(t.photoId, t.faceIndex),
    index("photo_faces_matched_user_idx").on(t.matchedUserId),
    // NOTE: HNSW index on embedding added by hand in migration SQL.
  ],
);

export const photoApprovals = pgTable(
  "photo_approvals",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    status: approvalStatus("status").notNull().default("pending"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.photoId] }),
    index("photo_approvals_user_status_idx").on(t.userId, t.status),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    photoId: uuid("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    status: reportStatus("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_status_idx").on(t.status)],
);
