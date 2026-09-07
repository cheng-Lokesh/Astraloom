import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  phaseWrites: [] as string[],
  routerReplace: vi.fn(),
  status: vi.fn(),
  useStateCalls: 0,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useCallback: <T,>(callback: T) => callback,
    useEffect: (effect: () => void | (() => void)) => { state.effects.push(effect); },
    useState: (initial: string) => {
      const isPhaseState = state.useStateCalls++ === 0;
      return [initial, (value: string) => { if (isPhaseState) state.phaseWrites.push(value); }];
    },
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.routerReplace }),
  useSearchParams: () => ({ get: () => "11111111-1111-4111-8111-111111111111" }),
}));
vi.mock("@/lib/formal-sandbox/client", () => ({
  createFormalSandboxClient: () => ({ status: state.status }),
}));

import { RunningController } from "./app/simulation/running/page";

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("RunningController persisted-status wiring", () => {
  beforeEach(() => {
    state.effects.length = 0;
    state.phaseWrites.length = 0;
    state.routerReplace.mockReset();
    state.status.mockReset();
    state.useStateCalls = 0;
  });

  it.each(["draft", "queued", "running", "blocked", "failed"])("uses the server's %s status on the first read and manual reread", async (status) => {
    state.status.mockResolvedValue({ ok: true, data: { run: { status } } });
    const surface = RunningController() as unknown as { props: { retry: () => void } };

    state.effects[0]();
    await settle();
    expect(state.phaseWrites.at(-1)).toBe(status);
    surface.props.retry();
    await settle();
    expect(state.phaseWrites.at(-1)).toBe(status);
    expect(state.status).toHaveBeenCalledTimes(2);
    expect(state.routerReplace).not.toHaveBeenCalled();
  });

  it("navigates to Result only after a completed server status", async () => {
    state.status.mockResolvedValue({ ok: true, data: { run: { status: "completed" } } });
    RunningController();

    state.effects[0]();
    await settle();
    expect(state.phaseWrites.at(-1)).toBe("completed");
    expect(state.routerReplace).toHaveBeenCalledWith("/app/simulation/result?run_id=11111111-1111-4111-8111-111111111111");
  });

  it.each([
    { ok: true, data: { run: { status: "future_state" } } },
    { ok: false, status: 500, errorCode: "private_transport_detail" },
  ])("fails closed without result navigation for unavailable status reads", async (response) => {
    state.status.mockResolvedValue(response);
    RunningController();

    state.effects[0]();
    await settle();
    expect(state.phaseWrites.at(-1)).toBe("error");
    expect(state.routerReplace).not.toHaveBeenCalled();
  });
});
