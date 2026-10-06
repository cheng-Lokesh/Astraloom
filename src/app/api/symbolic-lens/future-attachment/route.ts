import { readFutureAttachment, writeFutureAttachment } from "@/lib/formal-sandbox/future-attachment.server";
export const GET = readFutureAttachment;
export const PUT = writeFutureAttachment;
