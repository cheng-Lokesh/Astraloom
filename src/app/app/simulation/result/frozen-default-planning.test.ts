import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { projectDefaultPlanning, safeDefaultPlanningSchema } from "@/lib/formal-planning/projection";
import { planningRequest, planningSource, planningWorld, planningBindings } from "@/lib/formal-planning/test-fixtures";
import { proposeDefaultPlanning } from "@/lib/formal-planning/proposals";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { FrozenDefaultPlanningResult } from "./frozen-default-planning";
import { formalSandboxResultProjectionSchema } from "@/lib/formal-sandbox/client";
import { EvidenceWorkbenchView, initialFeedbackState, initialTargetedFeedbackState } from "./result-workbench";

it("shows the legally frozen planner budget and initial hypothesis as simulation assumptions",()=>{
 const frozen=freezeDefaultPlanning(planningRequest(),planningSource());
 expect(frozen.ok).toBe(true);if(!frozen.ok)return;
 const defaultPlanning=safeDefaultPlanningSchema.parse(projectDefaultPlanning(frozen.planning));
 const projection=formalSandboxResultProjectionSchema.parse({participants:[],relationships:[],facts:[],assumptions:[],steps:[],claims:[],resourceChanges:[],realityProfile:{status:"not_recorded",revision:null,facts:[],assumptions:[],unknowns:[],structuredResources:[],structuredConstraints:[],worldVariables:[]},defaultPlanning});
 expect(projection.defaultPlanning).toEqual(defaultPlanning);
 expect(formalSandboxResultProjectionSchema.parse(JSON.parse(JSON.stringify(projection))).defaultPlanning).toEqual(defaultPlanning);
 const noop=()=>{};
 const html=renderToStaticMarkup(createElement(EvidenceWorkbenchView,{projection,selectedClaimKey:null,onChooseClaim:noop,feedbackState:initialFeedbackState,onCommentChange:noop,onSaveFeedback:noop,targetFeedbackTarget:null,targetFeedbackState:initialTargetedFeedbackState,targetFeedbackSaving:false,onChooseFeedbackTarget:noop,onTargetRatingChange:noop,onTargetCommentChange:noop,onSaveTargetFeedback:noop}));
 for(const label of ["本次冻结的默认规划","整次模拟预算上限","首轮候选用量","关系影响尚未实现"])expect(html.includes(label)).toBe(true);
 expect(html.includes(frozen.planning.sourceBinding.ownerId)).toBe(false);
 expect(html.includes(frozen.planning.fusion.provenance?.snapshotId??"never-visible")).toBe(false);
});

it("renders actual controlled selected and not-selected event traces, not a predicted investment", () => {
 const frozen=freezeDefaultPlanning(planningRequest(),planningSource());
 if(!frozen.ok)throw new Error("fixture_invalid");
 const world=planningWorld(frozen.planning);
 const proposed=proposeDefaultPlanning({planning:frozen.planning,world,bindings:planningBindings(world),namespace:"frozen_result_ui",pathKey:"main",tickIndex:0,occurredAt:frozen.planning.sourceBinding.acceptedAt});
 const runtime={clock:()=>frozen.planning.sourceBinding.acceptedAt,idFactory:createStableAgentWorldIdFactoryV2("frozen-result-ui")};
 const approval=approveActionProposalV2(proposed.candidates[0],world,world.revision,runtime);
 if(!approval.ok)throw new Error("fixture_invalid");
 const transition=applyWorldTransitionV2(world,approval.command,runtime);
 if(!transition.ok)throw new Error("fixture_invalid");
 const selected=projectDefaultPlanning(frozen.planning,[{trace:proposed.trace,finalWorld:transition.world}]);
 expect(selected.trace[0]).toMatchObject({status:"selected",assumptionCategories:["formal_default_planning_resource_1","formal_symbolic_initial_planning_v1"]});
 expect(selected.trace[0].actualAmount).toBeCloseTo(0.9, 10);
 const selectedHtml=renderToStaticMarkup(createElement(FrozenDefaultPlanningResult,{planning:selected}));
 expect(selectedHtml.includes("已被模拟选中，实际受控事件投入 0.9")).toBe(true);
 expect(selectedHtml.includes("本人确认的整次资源预算假设、独立初始倾向产品假设")).toBe(true);
 const unselected=projectDefaultPlanning(frozen.planning,[{trace:proposed.trace,finalWorld:world}]);
 expect(unselected.trace[0]).toMatchObject({status:"not_selected",actualAmount:null});
 const unselectedHtml=renderToStaticMarkup(createElement(FrozenDefaultPlanningResult,{planning:unselected}));
 expect(unselectedHtml.includes("未被模拟选中；没有对应的实际投入事件")).toBe(true);
 expect(unselectedHtml.includes("实际受控事件投入")).toBe(false);
 expect(/ownerId|sourceRefs|snapshotId|birthDate|assumption_v2_|world_event_v2_|[0-9a-f]{8}-[0-9a-f]{4}-/.test(selectedHtml)).toBe(false);
});

it("keeps legacy planning not-recorded without current-source reconstruction", () => {
 const html=renderToStaticMarkup(createElement(FrozenDefaultPlanningResult,{planning:projectDefaultPlanning(undefined)}));
 expect(html.includes("旧运行未记录默认规划；不会补写预算或初始假设")).toBe(true);
 expect(html.includes("已被模拟选中")).toBe(false);
 expect(html.includes("5%")).toBe(false);
});
