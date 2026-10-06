import { readSymbolicLens, writeSymbolicLens } from "@/lib/formal-symbolic-lens/http.server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const GET = readSymbolicLens;
export async function PUT(request: Request) { return writeSymbolicLens(request); }
