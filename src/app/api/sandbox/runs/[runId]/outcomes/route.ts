import { outcomesHttp } from "@/lib/formal-sandbox/outcomes/http.server";
export const dynamic="force-dynamic";
export const revalidate=0;
export async function GET(request:Request,{params}:{params:Promise<{runId:string}>}){return outcomesHttp(request,(await params).runId);}
export async function POST(request:Request,{params}:{params:Promise<{runId:string}>}){return outcomesHttp(request,(await params).runId,true);}
