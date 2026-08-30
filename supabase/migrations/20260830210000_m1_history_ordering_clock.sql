-- M1.6: each completed formal Run must retain its creation order even when
-- two valid runs are created in one transaction for the same account.
alter table public.simulations
  alter column created_at set default clock_timestamp();
