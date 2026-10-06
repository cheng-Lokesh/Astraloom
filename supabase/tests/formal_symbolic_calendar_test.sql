begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_temp;
select no_plan();
-- These vectors are shared with the JS currentSymbolicPeriod tests: one
-- millisecond before/at every local approximate solar-month boundary,
-- including February year-pillar change and Shanghai year rollover.
select is(public.symbolic_calendar_period_v1(v.at),v.expected,'calendar JS/SQL parity boundary '||v.at::text)
from (values
  ('2026-01-05T15:59:59.999Z'::timestamptz,'{"key":"2026-01","referenceDate":"2026-01-05","structureKey":"yi_si_wu_zi","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-01-05T16:00:00.000Z'::timestamptz,'{"key":"2026-01","referenceDate":"2026-01-06","structureKey":"yi_si_ji_chou","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-02-03T15:59:59.999Z'::timestamptz,'{"key":"2026-02","referenceDate":"2026-02-03","structureKey":"yi_si_ji_chou","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-02-03T16:00:00.000Z'::timestamptz,'{"key":"2026-02","referenceDate":"2026-02-04","structureKey":"bing_wu_geng_yin","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-03-05T15:59:59.999Z'::timestamptz,'{"key":"2026-03","referenceDate":"2026-03-05","structureKey":"bing_wu_geng_yin","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-03-05T16:00:00.000Z'::timestamptz,'{"key":"2026-03","referenceDate":"2026-03-06","structureKey":"bing_wu_xin_mao","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-04-04T15:59:59.999Z'::timestamptz,'{"key":"2026-04","referenceDate":"2026-04-04","structureKey":"bing_wu_xin_mao","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-04-04T16:00:00.000Z'::timestamptz,'{"key":"2026-04","referenceDate":"2026-04-05","structureKey":"bing_wu_ren_chen","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-05-05T15:59:59.999Z'::timestamptz,'{"key":"2026-05","referenceDate":"2026-05-05","structureKey":"bing_wu_ren_chen","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-05-05T16:00:00.000Z'::timestamptz,'{"key":"2026-05","referenceDate":"2026-05-06","structureKey":"bing_wu_gui_si","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-06-05T15:59:59.999Z'::timestamptz,'{"key":"2026-06","referenceDate":"2026-06-05","structureKey":"bing_wu_gui_si","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-06-05T16:00:00.000Z'::timestamptz,'{"key":"2026-06","referenceDate":"2026-06-06","structureKey":"bing_wu_jia_wu","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-07-06T15:59:59.999Z'::timestamptz,'{"key":"2026-07","referenceDate":"2026-07-06","structureKey":"bing_wu_jia_wu","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-07-06T16:00:00.000Z'::timestamptz,'{"key":"2026-07","referenceDate":"2026-07-07","structureKey":"bing_wu_yi_wei","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-08-06T15:59:59.999Z'::timestamptz,'{"key":"2026-08","referenceDate":"2026-08-06","structureKey":"bing_wu_yi_wei","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-08-06T16:00:00.000Z'::timestamptz,'{"key":"2026-08","referenceDate":"2026-08-07","structureKey":"bing_wu_bing_shen","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-09-06T15:59:59.999Z'::timestamptz,'{"key":"2026-09","referenceDate":"2026-09-06","structureKey":"bing_wu_bing_shen","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-09-06T16:00:00.000Z'::timestamptz,'{"key":"2026-09","referenceDate":"2026-09-07","structureKey":"bing_wu_ding_you","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-10-07T15:59:59.999Z'::timestamptz,'{"key":"2026-10","referenceDate":"2026-10-07","structureKey":"bing_wu_ding_you","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-10-07T16:00:00.000Z'::timestamptz,'{"key":"2026-10","referenceDate":"2026-10-08","structureKey":"bing_wu_wu_xu","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-11-06T15:59:59.999Z'::timestamptz,'{"key":"2026-11","referenceDate":"2026-11-06","structureKey":"bing_wu_wu_xu","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-11-06T16:00:00.000Z'::timestamptz,'{"key":"2026-11","referenceDate":"2026-11-07","structureKey":"bing_wu_ji_hai","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-12-06T15:59:59.999Z'::timestamptz,'{"key":"2026-12","referenceDate":"2026-12-06","structureKey":"bing_wu_ji_hai","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-12-06T16:00:00.000Z'::timestamptz,'{"key":"2026-12","referenceDate":"2026-12-07","structureKey":"bing_wu_geng_zi","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-12-31T15:59:59.999Z'::timestamptz,'{"key":"2026-12","referenceDate":"2026-12-31","structureKey":"bing_wu_geng_zi","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb),
  ('2026-12-31T16:00:00.000Z'::timestamptz,'{"key":"2027-01","referenceDate":"2027-01-01","structureKey":"bing_wu_geng_zi","timezone":"Asia/Shanghai","granularity":"month"}'::jsonb)
) as v(at,expected);
select * from finish();
rollback;
