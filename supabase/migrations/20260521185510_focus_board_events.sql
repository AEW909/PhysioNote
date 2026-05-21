create table if not exists public.focus_board_events (
  id uuid primary key default gen_random_uuid(),
  board_key text not null,
  month_key date not null,
  week_start date not null,
  task_key text not null,
  metric_key text not null,
  points integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists focus_board_events_board_month_idx
  on public.focus_board_events (board_key, month_key, created_at desc);

create index if not exists focus_board_events_board_week_idx
  on public.focus_board_events (board_key, week_start, created_at desc);

alter table public.focus_board_events enable row level security;

revoke all on public.focus_board_events from anon, authenticated;
