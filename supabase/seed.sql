insert into public.settings (
  id, parent_pin, exchange_rate_label, comments, gacha_prizes
) values (
  'global',
  '123456',
  '100pt = 100円',
  '{
    "help": "助かったよ！ありがとう！",
    "tidy": "きれいになったね！",
    "study": "よくがんばったね！",
    "pet": "ケーちゃん、クーちゃん、ピーマンも喜んでいるよ！",
    "habit": "いい習慣だね！"
  }'::jsonb,
  '[
    {"id":"boost-help","label":"お手伝い2倍","probability":18,"type":"boost","categoryId":"help","multiplier":2},
    {"id":"boost-tidy","label":"お片付け2倍","probability":18,"type":"boost","categoryId":"tidy","multiplier":2},
    {"id":"boost-study","label":"お勉強・練習2倍","probability":18,"type":"boost","categoryId":"study","multiplier":2},
    {"id":"boost-pet","label":"ペットのお世話2倍","probability":18,"type":"boost","categoryId":"pet","multiplier":2},
    {"id":"boost-habit","label":"生活習慣2倍","probability":18,"type":"boost","categoryId":"habit","multiplier":2},
    {"id":"boost-all","label":"全部1.5倍","probability":5,"type":"boost","categoryId":"all","multiplier":1.5},
    {"id":"point-10","label":"10pt獲得","probability":4,"type":"points","points":10},
    {"id":"point-30","label":"30pt獲得","probability":1,"type":"points","points":30}
  ]'::jsonb
)
on conflict (id) do update
set parent_pin = excluded.parent_pin,
    exchange_rate_label = excluded.exchange_rate_label,
    comments = excluded.comments,
    gacha_prizes = excluded.gacha_prizes,
    updated_at = now();

insert into public.children (id, name, pin, points, sort_order) values
  ('child-a', 'Aくん', '1111', 0, 0),
  ('child-b', 'Bちゃん', '2222', 0, 1)
on conflict (id) do update
set name = excluded.name,
    pin = excluded.pin,
    sort_order = excluded.sort_order;

insert into public.categories (id, name, color, sort_order) values
  ('help', 'お手伝い', 'teal', 0),
  ('tidy', 'お片付け', 'blue', 1),
  ('study', 'お勉強・練習', 'green', 2),
  ('pet', 'ペットのお世話', 'amber', 3),
  ('habit', '生活習慣', 'red', 4)
on conflict (id) do update
set name = excluded.name,
    color = excluded.color,
    sort_order = excluded.sort_order;

insert into public.missions (
  id, category_id, name, description, points, kind, unit_label, unit_step,
  unit_points, max_units, max_points, active, sort_order
) values
  ('carry-dishes', 'help', '食器を運ぶ', '食器をキッチンまで運ぶ', 3, null, null, null, null, null, null, true, 0),
  ('laundry', 'help', '洗濯機へ入れる', '脱いだ服を洗濯機に入れる', 3, null, null, null, null, null, null, true, 1),
  ('futon-set', 'help', '布団を敷く', '布団を敷く', 10, null, null, null, null, null, null, true, 2),
  ('vacuum', 'help', '掃除機をかける', '掃除機をかける', 10, null, null, null, null, null, null, true, 3),
  ('futon-dry', 'help', '布団を干す', '布団を干す', 10, null, null, null, null, null, null, true, 4),
  ('trash-out', 'help', 'ゴミ出し', 'ゴミをゴミ捨て場に持っていく', 10, null, null, null, null, null, null, true, 5),
  ('trash-bin', 'tidy', 'ゴミをゴミ箱へ', '食事やお菓子のゴミ、おもちゃの包装、不要になったものなどをゴミ箱に入れる', 3, null, null, null, null, null, null, true, 6),
  ('put-back', 'tidy', '元の場所へ戻す', '使ったものを元の場所へ戻す。空手着をかごに入れることも含む', 3, null, null, null, null, null, null, true, 7),
  ('pet-bottle', 'tidy', 'ペットボトル片付け', 'ペットボトルの中身を捨ててゴミ箱に入れる', 3, null, null, null, null, null, null, true, 8),
  ('room-tidy', 'tidy', '部屋を片付ける', '部屋のものをクローゼットに入れる', 10, null, null, null, null, null, null, true, 9),
  ('trash-bundle', 'tidy', 'ゴミをまとめる', 'ゴミをまとめて畳の部屋に置く', 10, null, null, null, null, null, null, true, 10),
  ('kumon', 'study', 'くもんをやる', 'くもんの宿題をやる', null, 'quantity', '枚', null, 5, 20, 100, true, 11),
  ('homework', 'study', '宿題をやる', '学校の宿題を終わらせる', 10, null, null, null, null, null, null, true, 12),
  ('instrument', 'study', '楽器の練習をする', 'ブラスバンド部の楽器を練習する', null, 'duration', '分', 10, 5, null, 30, true, 13),
  ('dog-food', 'pet', '犬にえさをあげる', '犬に決められた量のえさをあげる', 10, null, null, null, null, null, null, true, 14),
  ('dog-walk', 'pet', '犬のお散歩をする', '親と一緒に犬のお散歩に行く', 10, null, null, null, null, null, null, true, 15),
  ('dog-poop', 'pet', '犬のうんち片付け', '犬のうんちをトイレに流す', 10, null, null, null, null, null, null, true, 16),
  ('toilet-sheet', 'pet', 'トイレシート交換', '犬のトイレシートを交換する', 20, null, null, null, null, null, null, true, 17),
  ('early-rise', 'habit', '早起きする', '朝6時30分より前に起きる', 5, null, null, null, null, null, null, true, 18),
  ('brush-teeth', 'habit', '歯を磨く', '歯をきちんと磨く', 10, null, null, null, null, null, null, true, 19)
on conflict (id) do update
set category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    points = excluded.points,
    kind = excluded.kind,
    unit_label = excluded.unit_label,
    unit_step = excluded.unit_step,
    unit_points = excluded.unit_points,
    max_units = excluded.max_units,
    max_points = excluded.max_points,
    active = excluded.active,
    sort_order = excluded.sort_order;

insert into public.rewards (id, name, points, yen, fixed, active, sort_order) values
  ('allowance-100', '100円おこづかい', 100, 100, true, true, 0),
  ('allowance-300', '300円おこづかい', 300, 300, true, true, 1),
  ('allowance-500', '500円おこづかい', 500, 500, true, true, 2)
on conflict (id) do update
set name = excluded.name,
    points = excluded.points,
    yen = excluded.yen,
    fixed = excluded.fixed,
    active = excluded.active,
    sort_order = excluded.sort_order;
