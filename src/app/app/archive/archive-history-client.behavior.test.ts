import { beforeEach, describe, expect, it, vi } from "vitest";

const state=vi.hoisted(()=>({stateCalls:0,stateOverrides:{} as Record<number,unknown>,stateSetterCalls:[] as Array<{index:number;value:unknown}>,reducerValue:undefined as unknown,reducerActions:[] as unknown[]}));
const completedId="completed-run";
const historyPayload=[
  {id:"draft-run",status:"draft"},
  {id:"queued-run",status:"queued"},
  {id:"running-run",status:"running"},
  {id:completedId,status:"completed"},
  {id:"blocked-run",status:"blocked"},
  {id:"failed-run",status:"failed"},
];

vi.mock("react",async(importOriginal)=>{const actual=await importOriginal<typeof import("react")>();return{...actual,useCallback:<T,>(callback:T)=>callback,useEffect:()=>undefined,useRef:<T,>(current:T)=>({current}),useReducer:(_reducer:unknown,initial:unknown)=>[state.reducerValue??initial,(action:unknown)=>state.reducerActions.push(action)],useState:<T,>(initial:T)=>{const index=state.stateCalls++;const value=Object.hasOwn(state.stateOverrides,index)?state.stateOverrides[index]:index===0?historyPayload as T:initial;return[value as T,(next:unknown)=>state.stateSetterCalls.push({index,value:next})]}};});
vi.mock("@/components/app-shell",()=>({AppShell:({children}: {children:unknown})=>children}));
vi.mock("@/components/ui-foundation",()=>({Button:()=>null,ButtonLink:()=>null,SurfaceCard:({children}: {children:unknown})=>children}));
vi.mock("@/lib/formal-sandbox/client",()=>({createFormalSandboxClient:()=>({history:vi.fn()})}));

import { ArchiveHistoryClient } from "./archive-history-client";

type Element={props?:{children?:unknown;href?:string;className?:string;type?:string;checked?:boolean;onChange?:()=>void;"aria-label"?:string}};
function descendants(node:unknown,found:Element[]=[]):Element[]{if(Array.isArray(node)){for(const child of node)descendants(child,found);return found}if(node&&typeof node==="object"&&"props" in node){const element=node as Element;found.push(element);descendants(element.props?.children,found)}return found}
function text(node:unknown):string{if(Array.isArray(node))return node.map(text).join("");if(typeof node==="string")return node;if(node&&typeof node==="object"&&"props" in node)return text((node as Element).props?.children);return ""}
function configureReadyHistory(runs:Array<{id:string;status:string;time_horizon:string}>,selectedRunIds:string[]){const projection={participants:[],relationships:[],facts:[],assumptions:[],realityProfile:{status:"not_recorded",revision:null,facts:[],assumptions:[],unknowns:[]},steps:[],claims:[]};state.stateOverrides[0]=runs;state.stateOverrides[3]="ready";state.stateOverrides[7]={phase:"ready",columns:[{run:runs[0],projection},{run:runs[1],projection}]};state.reducerValue=selectedRunIds;}

describe("ArchiveHistoryClient completed-result boundary",()=>{
  beforeEach(()=>{state.stateCalls=0;state.stateOverrides={};state.stateSetterCalls=[];state.reducerValue=undefined;state.reducerActions=[]});

  it("does not render a completion badge or Result link for five non-completed statuses in an unexpected History payload",()=>{
    const elements=descendants(ArchiveHistoryClient({timeUnavailableLabel:"time unavailable"}));
    const resultLinks=elements.filter((element)=>element.props?.href?.startsWith("/app/simulation/result?run_id="));
    const completionBadges=elements.filter((element)=>element.props?.className?.includes("text-[var(--verified-green)]"));

    expect(resultLinks).toHaveLength(1);
    expect(resultLinks.map((element)=>element.props?.href)).toEqual([`/app/simulation/result?run_id=${completedId}`]);
    expect(completionBadges.map(text)).toEqual(["completed"]);
  });

  it("offers comparison selection only for the completed History entry",()=>{
    const tree=ArchiveHistoryClient({timeUnavailableLabel:"time unavailable"});
    const elements=descendants(tree);
    const selectors=elements.filter((element)=>element.props?.type==="checkbox");

    expect(selectors).toHaveLength(1);
    expect(text(tree)).toContain("比较所选 Run");
  });

  it("keeps the current comparison when a third completed Run is rejected",()=>{
    const runs=[
      {id:"first-run",status:"completed",time_horizon:"30_days"},
      {id:"second-run",status:"completed",time_horizon:"90_days"},
      {id:"third-run",status:"completed",time_horizon:"30_days"},
    ];
    configureReadyHistory(runs,[runs[0].id,runs[1].id]);

    const tree=ArchiveHistoryClient({timeUnavailableLabel:"time unavailable"});
    const selectors=descendants(tree).filter((element)=>element.props?.type==="checkbox");
    expect(selectors.map((element)=>element.props?.checked)).toEqual([true,true,false]);

    selectors[2].props?.onChange?.();

    expect(state.stateSetterCalls).toContainEqual({index:6,value:"一次最多比较两条 Run；请先取消一条选择。"});
    expect(state.stateSetterCalls.filter((call)=>call.index===7)).toEqual([]);
    expect(state.reducerActions).toEqual([]);
  });

  it("invalidates the current comparison when an existing selection actually changes",()=>{
    const runs=[
      {id:"first-run",status:"completed",time_horizon:"30_days"},
      {id:"second-run",status:"completed",time_horizon:"90_days"},
    ];
    configureReadyHistory(runs,[runs[0].id,runs[1].id]);

    const selectors=descendants(ArchiveHistoryClient({timeUnavailableLabel:"time unavailable"})).filter((element)=>element.props?.type==="checkbox");
    selectors[0].props?.onChange?.();

    expect(state.reducerActions).toEqual([{type:"toggle",runId:runs[0].id,runs}]);
    expect(state.stateSetterCalls).toContainEqual({index:7,value:{phase:"idle",columns:null}});
  });
});
