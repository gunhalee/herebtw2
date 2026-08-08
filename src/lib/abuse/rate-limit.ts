import { createHmac } from "node:crypto";
import { supabaseRpc } from "../supabase/rest";
import type { AbuseAction } from "./policy";

type Budget = {
  limit: number;
  windowSeconds: number;
};

type ConsumeBudgetRow = {
  allowed: boolean;
  request_count: number;
  retry_after_seconds: number;
};

function getSubjectHashSecret() {
  const secret =
    process.env.ABUSE_SUBJECT_HASH_SECRET ??
    process.env.ABUSE_DEVICE_TOKEN_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ABUSE_SUBJECT_HASH_SECRET or ABUSE_DEVICE_TOKEN_SECRET must contain at least 32 characters.",
    );
  }

  return secret;
}

export function hashAbuseSubject(value: string, secret = getSubjectHashSecret()) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function getTrustedNetworkSubject(request: Request) {
  if (process.env.VERCEL !== "1") {
    return null;
  }

  const address =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");
  const secret = process.env.ABUSE_NETWORK_HASH_SECRET_CURRENT;

  if (!address || !secret || secret.length < 32) {
    return null;
  }

  return hashAbuseSubject(address.trim(), secret);
}

async function consumeBudget(input: {
  action: AbuseAction;
  budget: Budget;
  subjectHash: string;
  subjectKind: "account" | "device" | "network";
}) {
  const rows =
    (await supabaseRpc<ConsumeBudgetRow[]>("consume_abuse_budget", {
      p_action: input.action,
      p_request_limit: input.budget.limit,
      p_subject_hash: input.subjectHash,
      p_subject_kind: input.subjectKind,
      p_window_seconds: input.budget.windowSeconds,
    })) ?? [];

  const row = rows[0];

  if (!row) {
    throw new Error("Abuse budget RPC returned no result.");
  }

  return {
    allowed: Boolean(row.allowed),
    count: Number(row.request_count),
    retryAfterSeconds: Math.max(0, Number(row.retry_after_seconds)),
  };
}

export async function consumeAbuseBudgets(input: {
  action: AbuseAction;
  budgets: readonly Budget[];
  subjectHash: string;
  subjectKind: "account" | "device" | "network";
}) {
  for (const budget of input.budgets) {
    const result = await consumeBudget({ ...input, budget });

    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true, count: 0, retryAfterSeconds: 0 };
}
