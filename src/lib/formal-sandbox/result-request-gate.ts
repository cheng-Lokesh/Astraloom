export type ResultRequestToken = Readonly<{ runId: string; generation: number }>;

export type ResultRequestState<Projection> =
  | { phase: "loading"; runId: string }
  | { phase: "error"; runId: string; message: string }
  | { phase: "ready"; runId: string; projection: Projection };

export function createResultRequestGate<Projection>(render: (state: ResultRequestState<Projection>) => void) {
  let generation = 0;
  let current: ResultRequestToken | null = null;
  const isCurrent = (token: ResultRequestToken) => current?.generation === token.generation && current.runId === token.runId;

  return {
    begin(runId: string): ResultRequestToken {
      const token = { runId, generation: ++generation };
      current = token;
      render({ phase: "loading", runId });
      return token;
    },
    resolve(token: ResultRequestToken, projection: Projection) {
      if (!isCurrent(token)) return false;
      render({ phase: "ready", runId: token.runId, projection });
      return true;
    },
    reject(token: ResultRequestToken, message: string) {
      if (!isCurrent(token)) return false;
      render({ phase: "error", runId: token.runId, message });
      return true;
    },
    cancel(token: ResultRequestToken) {
      if (isCurrent(token)) current = null;
    },
    invalidate() {
      current = null;
      generation += 1;
    },
  };
}
