# Cursor 一発生成プロンプト - 「あといくら？メモ」

本プロジェクトをCursor等のAIエディタ（React/Next.js/Supabase）で一気に初期化・構築するためのプロンプトです。Cursorの `Cmd + K` や Composer (`Cmd + I`) で使用してください。

---

## 🚀 アプリ基盤作成＆要件プロンプト

```markdown
Next.js (App Router), Tailwind CSS, Supabase を利用して「あといくら？メモ」というWebアプリを作成してください。PWA/スマホファーストのUIを想定しています。

【仕様概要】
1. **目的**: 買い物直後に入力し、今月の残額・残日数・1日あたりの使用可能額を「全体・食費・日用品・その他」のタブで即座に可視化する。
2. **デザイン・UI**: Glassmorphism風のモダンで美しいUI。色は状態に応じて緑（余裕）黄（注意）赤（危険）に変化させる。
3. **データ構造 (Supabase)**:
   - `budgets`: id, user_id, month (YYYY-MM), budget_all, budget_food, budget_daily, budget_other
   - `expenses`: id, user_id, amount, category (Enum: food/daily/other), date

【ステップ１：ダッシュボードUIの作成】
以下のコンポーネントを作成してください:
1. `DashboardView`: メイン画面。上部に「全体 / 食費 / 日用品 / その他」の切り替えタブ。
2. 各タブを選択すると、今月の予算、使用金額、残り金額、残り日数が切り替わります。
3. 下記の計算ロジックを含めてください:
   - 残り金額 = 予算 - 使用済み金額
   - 1日あたり OK な金額 = 残り金額 / 残日数 (マイナスの場合は0)
   - 状態によってプログレスバーの色を変える (50%以下: bg-green-500, 80%以下: bg-yellow-500, それ以上: bg-red-500)

【ステップ２：データモックとフックの作成】
Supabase連携前の段階として、まずはローカルの `useState` で動作するようにしてください。ダミーデータのexpensesを数件持たせ、入力フォームから金額を追加すれば即座にダッシュボードが再計算されるようにします。

【デザインの指示】
- Apple iOS のような美しいカードデザイン `rounded-2xl` と `shadow-lg` を使うこと。
- 余白をたっぷりと取り、`sm:max-w-md mx-auto` で中央寄せのスマホ幅にすること。
```

---

*このプロンプトを投げるだけで、Next.js上での美しいモックアップが生成されます。その後、連携するSupabaseのキーを入れてDB接続を行います。*
