# 「あといくら？メモ」Supabase スキーマ設計

Supabase (PostgreSQL) を利用して、このアプリを実装するための基本設計です。
RLS (Row Level Security) により、ユーザー自身のデータのみにアクセスできるようにします。

## Enum Types
```sql
-- カテゴリのEnum
CREATE TYPE expense_category AS ENUM ('food', 'daily', 'other');
```

## 1. Profiles Table (ユーザーテーブル)
Supabaseの標準Authと連携するユーザープロフィール情報。

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using ( auth.uid() = id );
```

## 2. Budgets Table (予算テーブル)
月ごとにユーザーが設定した予算（全体・カテゴリ別）を保持します。

```sql
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month varchar(7) not null, -- 'YYYY-MM'
  budget_all integer not null default 50000,
  budget_food integer not null default 30000,
  budget_daily integer not null default 10000,
  budget_other integer not null default 10000,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, month)
);

-- RLS
alter table public.budgets enable row level security;
create policy "Users can modify own budgets" on public.budgets for all using ( auth.uid() = user_id );
```

## 3. Expenses Table (支出テーブル)
ユーザーの支出記録。ダッシュボードではこれらを合算して表示します。

```sql
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount integer not null,
  category expense_category not null,
  date date not null, -- 'YYYY-MM-DD'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- インデックス作成 (月ごとの集計を爆速にするため)
create index expenses_user_category_date_idx on public.expenses(user_id, category, date);
create index expenses_user_date_idx on public.expenses(user_id, date);

-- RLS
alter table public.expenses enable row level security;
create policy "Users can modify own expenses" on public.expenses for all using ( auth.uid() = user_id );
```

## DB関数・トリガー (オプション)
必要であれば、`profiles` 自動作成トリガーなどを追加します。
