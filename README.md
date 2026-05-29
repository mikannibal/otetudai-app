# お手伝いアプリ Ver1

家庭内で使う子ども向けのお手伝い・習慣化アプリです。Supabaseを設定すると、親スマホ・子どもスマホ・PCで同じデータを共有できます。`localStorage` は最後に読めた状態の一時キャッシュとして使います。

## 開き方

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

起動後、ブラウザで `http://127.0.0.1:4173/` を開きます。

## Supabase設定

1. SupabaseのSQL Editorで `supabase/schema.sql` を実行します。
2. 初期データをSQLで入れる場合は、続けて `supabase/seed.sql` を実行します。
3. もしくは、空のテーブルならアプリ初回起動時に既定データが自動投入されます。
4. `config.js` に Supabase URL と anon key を設定します。

```js
window.OTEDUTAI_CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key",
  ENABLE_REALTIME: true,
};
```

`config.js` が未設定の場合は、従来に近いローカルキャッシュモードで起動します。

## 初期PIN

- 親: `123456`
- Aくん: `1111`
- Bちゃん: `2222`

## 実装済み

- 子どもログイン、親ログイン
- 毎日1回の無料ガチャ
- ミッション申請、特殊ミッションの枚数・時間入力
- 親の承認、ポイント修正承認、却下
- 定型コメントと自由コメント
- ごほうび交換申請、承認、却下
- 未払いおこづかい集計と「まとめてあげた」
- 子ども履歴、親履歴、月間集計、累計集計
- ミッション管理、ごほうび管理、PIN・コメント・ガチャ確率設定
- 親設定から今日のガチャを全員分/子どもごとにリセット
- Supabase読み書き、初期seed、Realtime同期

## テーブル

- `children`
- `categories`
- `missions`
- `submissions`
- `rewards`
- `reward_requests`
- `point_history`
- `gacha_history`
- `settings`

`categories` は既存UIのカテゴリ一覧とミッション紐づけのために追加しています。おこづかいの未払い・支払い済みは `reward_requests.allowance_status` と `paid_at` で管理します。

## 注意

Ver1では家庭内利用を優先し、Supabase Authではなくアプリ内PINを維持しています。`anon` でテーブル操作を許可する設計なので、URLとanon keyを公開サイトに置く運用には向きません。
