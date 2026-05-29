import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ensureSchema } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

async function runApi<T>(fn: () => Promise<NextResponse<T>>) {
  try {
    if (!schemaReady) schemaReady = ensureSchema();
    await schemaReady;
    return await fn();
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "validation", details: e.flatten() }, { status: 400 });
    }
    console.error("[api]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export function withSchema(handler: (req: Request) => Promise<NextResponse>) {
  return (req: Request) => runApi(() => handler(req));
}

export function withSchemaParams<P extends Record<string, string>>(
  handler: (req: Request, ctx: { params: Promise<P> }) => Promise<NextResponse>,
) {
  return (req: Request, ctx: { params: Promise<P> }) => runApi(() => handler(req, ctx));
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}
