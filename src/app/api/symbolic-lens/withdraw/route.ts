import { writeSymbolicLens } from "@/lib/formal-symbolic-lens/http.server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function POST(request: Request) { return writeSymbolicLens(request, true); }
