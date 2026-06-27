import type { NextConfig } from "next";

const stage67PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";
const stage67PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation";
const stage68PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";
const stage68PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go";
const stage69PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";
const stage69PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation";
const stage70PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";
const stage70PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review";
const stage71PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";
const stage71PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go";
const stage72PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation";
const stage72PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation";
const stage73PublicPage =
  "/server-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review";
const stage73PublicApi =
  "/api/system-writers/persistence-authorization-reconsideration-final-decision-archive-remediation-review-no-go-reconciliation-remediation-review-no-go-reconciliation-no-go-remediation-review-no-go-remediation-review";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: stage67PublicPage,
        destination: "/server-writers/p67-reconciliation",
      },
      {
        source: stage67PublicApi,
        destination: "/api/system-writers/p67-reconciliation",
      },
      {
        source: stage68PublicPage,
        destination: "/server-writers/p68-reconciliation-no-go",
      },
      {
        source: stage68PublicApi,
        destination: "/api/system-writers/p68-reconciliation-no-go",
      },
      {
        source: stage69PublicPage,
        destination: "/server-writers/p69-reconciliation-no-go-remediation",
      },
      {
        source: stage69PublicApi,
        destination: "/api/system-writers/p69-reconciliation-no-go-remediation",
      },
      {
        source: stage70PublicPage,
        destination: "/server-writers/p70-reconciliation-no-go-remediation-review",
      },
      {
        source: stage70PublicApi,
        destination:
          "/api/system-writers/p70-reconciliation-no-go-remediation-review",
      },
      {
        source: stage71PublicPage,
        destination:
          "/server-writers/p71-reconciliation-no-go-remediation-review-no-go",
      },
      {
        source: stage71PublicApi,
        destination:
          "/api/system-writers/p71-reconciliation-no-go-remediation-review-no-go",
      },
      {
        source: stage72PublicPage,
        destination: "/server-writers/p72-remediation",
      },
      {
        source: stage72PublicApi,
        destination: "/api/system-writers/p72-remediation",
      },
      {
        source: stage73PublicPage,
        destination: "/server-writers/p73-remediation-review",
      },
      {
        source: stage73PublicApi,
        destination: "/api/system-writers/p73-remediation-review",
      },
    ];
  },
};

export default nextConfig;
