"use strict";

const CACHE_KEY = "otedutai-app-v1-cache";
const LEGACY_STORAGE_KEY = "otedutai-app-v1";
const SUPABASE_CONFIG = window.OTEDUTAI_CONFIG || {};
const REMOTE_TABLES = [
  "children",
  "categories",
  "missions",
  "submissions",
  "rewards",
  "reward_requests",
  "point_history",
  "gacha_history",
  "settings",
];
const DATE_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const CATEGORY_COMMENTS = {
  help: "助かったよ！ありがとう！",
  tidy: "きれいになったね！",
  study: "よくがんばったね！",
  pet: "ケーちゃん、クーちゃん、ピーマンも喜んでいるよ！",
  habit: "いい習慣だね！",
};

const DEFAULT_STATE = {
  version: 1,
  settings: {
    parentPin: "123456",
    exchangeRateLabel: "100pt = 100円",
    comments: CATEGORY_COMMENTS,
    gachaPrizes: [
      { id: "boost-help", label: "お手伝い2倍", probability: 18, type: "boost", categoryId: "help", multiplier: 2 },
      { id: "boost-tidy", label: "お片付け2倍", probability: 18, type: "boost", categoryId: "tidy", multiplier: 2 },
      { id: "boost-study", label: "お勉強・練習2倍", probability: 18, type: "boost", categoryId: "study", multiplier: 2 },
      { id: "boost-pet", label: "ペットのお世話2倍", probability: 18, type: "boost", categoryId: "pet", multiplier: 2 },
      { id: "boost-habit", label: "生活習慣2倍", probability: 18, type: "boost", categoryId: "habit", multiplier: 2 },
      { id: "boost-all", label: "全部1.5倍", probability: 5, type: "boost", categoryId: "all", multiplier: 1.5 },
      { id: "point-10", label: "10pt獲得", probability: 4, type: "points", points: 10 },
      { id: "point-30", label: "30pt獲得", probability: 1, type: "points", points: 30 },
    ],
  },
  children: [
    { id: "child-a", name: "Aくん", pin: "1111", points: 0 },
    { id: "child-b", name: "Bちゃん", pin: "2222", points: 0 },
  ],
  categories: [
    { id: "help", name: "お手伝い", color: "teal" },
    { id: "tidy", name: "お片付け", color: "blue" },
    { id: "study", name: "お勉強・練習", color: "green" },
    { id: "pet", name: "ペットのお世話", color: "amber" },
    { id: "habit", name: "生活習慣", color: "red" },
  ],
  missions: [
    { id: "carry-dishes", categoryId: "help", name: "食器を運ぶ", description: "食器をキッチンまで運ぶ", points: 3 },
    { id: "laundry", categoryId: "help", name: "洗濯機へ入れる", description: "脱いだ服を洗濯機に入れる", points: 3 },
    { id: "futon-set", categoryId: "help", name: "布団を敷く", description: "布団を敷く", points: 10 },
    { id: "vacuum", categoryId: "help", name: "掃除機をかける", description: "掃除機をかける", points: 10 },
    { id: "futon-dry", categoryId: "help", name: "布団を干す", description: "布団を干す", points: 10 },
    { id: "trash-out", categoryId: "help", name: "ゴミ出し", description: "ゴミをゴミ捨て場に持っていく", points: 10 },
    { id: "trash-bin", categoryId: "tidy", name: "ゴミをゴミ箱へ", description: "食事やお菓子のゴミ、おもちゃの包装、不要になったものなどをゴミ箱に入れる", points: 3 },
    { id: "put-back", categoryId: "tidy", name: "元の場所へ戻す", description: "使ったものを元の場所へ戻す。空手着をかごに入れることも含む", points: 3 },
    { id: "pet-bottle", categoryId: "tidy", name: "ペットボトル片付け", description: "ペットボトルの中身を捨ててゴミ箱に入れる", points: 3 },
    { id: "room-tidy", categoryId: "tidy", name: "部屋を片付ける", description: "部屋のものをクローゼットに入れる", points: 10 },
    { id: "trash-bundle", categoryId: "tidy", name: "ゴミをまとめる", description: "ゴミをまとめて畳の部屋に置く", points: 10 },
    { id: "kumon", categoryId: "study", name: "くもんをやる", description: "くもんの宿題をやる", kind: "quantity", unitLabel: "枚", unitPoints: 5, maxUnits: 20, maxPoints: 100 },
    { id: "homework", categoryId: "study", name: "宿題をやる", description: "学校の宿題を終わらせる", points: 10 },
    { id: "instrument", categoryId: "study", name: "楽器の練習をする", description: "ブラスバンド部の楽器を練習する", kind: "duration", unitLabel: "分", unitStep: 10, unitPoints: 5, maxPoints: 30 },
    { id: "dog-food", categoryId: "pet", name: "犬にえさをあげる", description: "犬に決められた量のえさをあげる", points: 10 },
    { id: "dog-walk", categoryId: "pet", name: "犬のお散歩をする", description: "親と一緒に犬のお散歩に行く", points: 10 },
    { id: "dog-poop", categoryId: "pet", name: "犬のうんち片付け", description: "犬のうんちをトイレに流す", points: 10 },
    { id: "toilet-sheet", categoryId: "pet", name: "トイレシート交換", description: "犬のトイレシートを交換する", points: 20 },
    { id: "early-rise", categoryId: "habit", name: "早起きする", description: "朝6時30分より前に起きる", points: 5 },
    { id: "brush-teeth", categoryId: "habit", name: "歯を磨く", description: "歯をきちんと磨く", points: 10 },
  ],
  rewards: [
    { id: "allowance-100", name: "100円おこづかい", points: 100, yen: 100, fixed: true },
    { id: "allowance-300", name: "300円おこづかい", points: 300, yen: 300, fixed: true },
    { id: "allowance-500", name: "500円おこづかい", points: 500, yen: 500, fixed: true },
  ],
  submissions: [],
  pointHistory: [],
  gachaHistory: [],
  rewardRequests: [],
  allowanceLedger: [],
};

const ui = {
  session: null,
  loginMode: "child",
  selectedChildId: "child-a",
  childTab: "home",
  parentTab: "dashboard",
  missionCategory: "help",
  historyTab: "points",
  parentHistoryTab: "approvals",
  modal: null,
  toast: "",
  toastTimer: null,
};

let state = loadState();
const root = document.querySelector("#app");
const remote = {
  client: null,
  enabled: false,
  status: "local",
  message: "Supabase未設定",
  channel: null,
  refreshTimer: null,
};

function loadState() {
  const saved = localStorage.getItem(CACHE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return structuredClone(DEFAULT_STATE);
  try {
    const parsed = JSON.parse(saved);
    return mergeDefaults(parsed);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function mergeDefaults(saved) {
  const base = structuredClone(DEFAULT_STATE);
  const merged = {
    ...base,
    ...saved,
    settings: {
      ...base.settings,
      ...(saved.settings || {}),
      comments: { ...base.settings.comments, ...((saved.settings && saved.settings.comments) || {}) },
      gachaPrizes: saved.settings?.gachaPrizes || base.settings.gachaPrizes,
    },
  };
  for (const key of ["children", "categories", "missions", "rewards", "submissions", "pointHistory", "gachaHistory", "rewardRequests", "allowanceLedger"]) {
    merged[key] = Array.isArray(saved[key]) ? saved[key] : base[key];
  }
  return merged;
}

function saveState() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(state));
}

function hasSupabaseConfig() {
  return Boolean(SUPABASE_CONFIG.SUPABASE_URL && SUPABASE_CONFIG.SUPABASE_ANON_KEY);
}

function setupSupabaseClient() {
  if (!hasSupabaseConfig()) {
    remote.enabled = false;
    remote.status = "local";
    remote.message = "Supabase未設定";
    return;
  }
  if (!window.supabase?.createClient) {
    remote.enabled = false;
    remote.status = "error";
    remote.message = "Supabaseライブラリ未読込";
    return;
  }
  remote.client = window.supabase.createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY,
  );
  remote.enabled = true;
  remote.status = "syncing";
  remote.message = "Supabase同期中";
}

async function initializeApp() {
  setupSupabaseClient();
  render();
  if (!remote.enabled) return;
  await refreshRemoteState({ seedIfEmpty: true });
  subscribeToRemoteChanges();
}

function syncStatusLabel() {
  if (remote.status === "synced") return "Supabase同期済み";
  if (remote.status === "syncing") return "同期中";
  if (remote.status === "error") return remote.message || "同期エラー";
  return "ローカルキャッシュ";
}

async function readRows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function expectOk(query) {
  const { error } = await query;
  if (error) throw error;
}

async function callRpc(name, args) {
  const { data, error } = await remote.client.rpc(name, args);
  if (error) throw error;
  return data;
}

async function refreshRemoteState(options = {}) {
  if (!remote.enabled) return;
  if (!options.quiet) {
    remote.status = "syncing";
    remote.message = "Supabase同期中";
    render();
  }
  try {
    if (options.seedIfEmpty) {
      await seedSupabaseIfEmpty();
    }
    state = await fetchRemoteState();
    saveState();
    remote.status = "synced";
    remote.message = "Supabase同期済み";
  } catch (error) {
    console.error(error);
    remote.status = "error";
    remote.message = "Supabase同期エラー";
    if (!options.quiet) showToast("Supabaseから読み込めませんでした");
  } finally {
    render();
  }
}

async function fetchRemoteState() {
  const [
    settingsRows,
    childRows,
    categoryRows,
    missionRows,
    rewardRows,
    submissionRows,
    rewardRequestRows,
    pointRows,
    gachaRows,
  ] = await Promise.all([
    readRows(remote.client.from("settings").select("*")),
    readRows(remote.client.from("children").select("*").order("sort_order", { ascending: true })),
    readRows(remote.client.from("categories").select("*").order("sort_order", { ascending: true })),
    readRows(remote.client.from("missions").select("*").eq("active", true).order("sort_order", { ascending: true })),
    readRows(remote.client.from("rewards").select("*").eq("active", true).order("sort_order", { ascending: true })),
    readRows(remote.client.from("submissions").select("*").order("created_at", { ascending: false })),
    readRows(remote.client.from("reward_requests").select("*").order("created_at", { ascending: false })),
    readRows(remote.client.from("point_history").select("*").order("created_at", { ascending: false })),
    readRows(remote.client.from("gacha_history").select("*").order("created_at", { ascending: false })),
  ]);

  const settingsRow = settingsRows.find((row) => row.id === "global") || settingsRows[0];
  const rewardRequests = rewardRequestRows.map(fromDbRewardRequest);
  return mergeDefaults({
    version: 1,
    settings: fromDbSettings(settingsRow),
    children: childRows.map(fromDbChild),
    categories: categoryRows.length ? categoryRows.map(fromDbCategory) : DEFAULT_STATE.categories,
    missions: missionRows.map(fromDbMission),
    rewards: rewardRows.map(fromDbReward),
    submissions: submissionRows.map(fromDbSubmission),
    rewardRequests,
    pointHistory: pointRows.map(fromDbPointHistory),
    gachaHistory: gachaRows.map(fromDbGacha),
    allowanceLedger: rewardRequests
      .filter((request) => request.status === "approved" && Number(request.yen || 0) > 0)
      .map(allowanceFromRewardRequest),
  });
}

async function seedSupabaseIfEmpty() {
  const seedState = mergeDefaults(state);
  const [
    settingsRows,
    childRows,
    categoryRows,
    missionRows,
    rewardRows,
    submissionRows,
    rewardRequestRows,
    pointRows,
    gachaRows,
  ] = await Promise.all([
    readRows(remote.client.from("settings").select("id").limit(1)),
    readRows(remote.client.from("children").select("id").limit(1)),
    readRows(remote.client.from("categories").select("id").limit(1)),
    readRows(remote.client.from("missions").select("id").limit(1)),
    readRows(remote.client.from("rewards").select("id").limit(1)),
    readRows(remote.client.from("submissions").select("id").limit(1)),
    readRows(remote.client.from("reward_requests").select("id").limit(1)),
    readRows(remote.client.from("point_history").select("id").limit(1)),
    readRows(remote.client.from("gacha_history").select("id").limit(1)),
  ]);

  if (!settingsRows.length) {
    await expectOk(remote.client.from("settings").upsert(toDbSettings(seedState.settings), { onConflict: "id" }));
  }
  if (!childRows.length) {
    await expectOk(remote.client.from("children").upsert(seedState.children.map(toDbChild), { onConflict: "id" }));
  }
  if (!categoryRows.length) {
    await expectOk(remote.client.from("categories").upsert(seedState.categories.map(toDbCategory), { onConflict: "id" }));
  }
  if (!missionRows.length) {
    await expectOk(remote.client.from("missions").upsert(seedState.missions.map(toDbMission), { onConflict: "id" }));
  }
  if (!rewardRows.length) {
    await expectOk(remote.client.from("rewards").upsert(seedState.rewards.map(toDbReward), { onConflict: "id" }));
  }
  if (!submissionRows.length && seedState.submissions.length) {
    await expectOk(remote.client.from("submissions").upsert(seedState.submissions.map(toDbSubmission), { onConflict: "id" }));
  }
  if (!rewardRequestRows.length && seedState.rewardRequests.length) {
    await expectOk(remote.client.from("reward_requests").upsert(seedState.rewardRequests.map(toDbRewardRequest), { onConflict: "id" }));
  }
  if (!pointRows.length && seedState.pointHistory.length) {
    await expectOk(remote.client.from("point_history").upsert(seedState.pointHistory.map(toDbPointHistory), { onConflict: "id" }));
  }
  if (!gachaRows.length && seedState.gachaHistory.length) {
    await expectOk(remote.client.from("gacha_history").upsert(seedState.gachaHistory.map(toDbGacha), { onConflict: "id" }));
  }
}

function subscribeToRemoteChanges() {
  if (!remote.enabled || SUPABASE_CONFIG.ENABLE_REALTIME === false) return;
  const channel = remote.client.channel("otedutai-v1-db");
  for (const table of REMOTE_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => scheduleRemoteRefresh(),
    );
  }
  remote.channel = channel.subscribe();
}

function scheduleRemoteRefresh() {
  clearTimeout(remote.refreshTimer);
  remote.refreshTimer = setTimeout(() => {
    void refreshRemoteState({ quiet: true });
  }, 500);
}

function toDbSettings(settings) {
  return {
    id: "global",
    parent_pin: settings.parentPin,
    exchange_rate_label: settings.exchangeRateLabel,
    comments: settings.comments,
    gacha_prizes: settings.gachaPrizes,
    updated_at: new Date().toISOString(),
  };
}

function fromDbSettings(row) {
  if (!row) return DEFAULT_STATE.settings;
  return {
    parentPin: row.parent_pin || DEFAULT_STATE.settings.parentPin,
    exchangeRateLabel: row.exchange_rate_label || DEFAULT_STATE.settings.exchangeRateLabel,
    comments: { ...CATEGORY_COMMENTS, ...(row.comments || {}) },
    gachaPrizes: Array.isArray(row.gacha_prizes) ? row.gacha_prizes : DEFAULT_STATE.settings.gachaPrizes,
  };
}

function toDbChild(child, index = 0) {
  return {
    id: child.id,
    name: child.name,
    pin: child.pin,
    points: Number(child.points || 0),
    sort_order: index,
  };
}

function fromDbChild(row) {
  return {
    id: row.id,
    name: row.name,
    pin: row.pin,
    points: Number(row.points || 0),
  };
}

function toDbCategory(category, index = 0) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    sort_order: index,
  };
}

function fromDbCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color || "teal",
  };
}

function toDbMission(mission, index = 0) {
  return {
    id: mission.id,
    category_id: mission.categoryId,
    name: mission.name,
    description: mission.description,
    points: mission.points ?? null,
    kind: mission.kind ?? null,
    unit_label: mission.unitLabel ?? null,
    unit_step: mission.unitStep ?? null,
    unit_points: mission.unitPoints ?? null,
    max_units: mission.maxUnits ?? null,
    max_points: mission.maxPoints ?? null,
    active: mission.active !== false,
    sort_order: index,
  };
}

function fromDbMission(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    points: row.points === null ? undefined : Number(row.points || 0),
    kind: row.kind || undefined,
    unitLabel: row.unit_label || undefined,
    unitStep: row.unit_step === null ? undefined : Number(row.unit_step || 0),
    unitPoints: row.unit_points === null ? undefined : Number(row.unit_points || 0),
    maxUnits: row.max_units === null ? undefined : Number(row.max_units || 0),
    maxPoints: row.max_points === null ? undefined : Number(row.max_points || 0),
    active: row.active !== false,
  };
}

function toDbReward(reward, index = 0) {
  return {
    id: reward.id,
    name: reward.name,
    points: Number(reward.points || 0),
    yen: Number(reward.yen || 0),
    fixed: Boolean(reward.fixed),
    active: reward.active !== false,
    sort_order: index,
  };
}

function fromDbReward(row) {
  return {
    id: row.id,
    name: row.name,
    points: Number(row.points || 0),
    yen: Number(row.yen || 0),
    fixed: Boolean(row.fixed),
    active: row.active !== false,
  };
}

function toDbSubmission(item) {
  return {
    id: item.id,
    child_id: item.childId,
    mission_id: item.missionId,
    mission_name: item.missionName,
    category_id: item.categoryId,
    category_name: item.categoryName,
    base_points: Number(item.basePoints || 0),
    requested_points: Number(item.requestedPoints || 0),
    approved_points: item.approvedPoints ?? null,
    multiplier: Number(item.multiplier || 1),
    boost_label: item.boostLabel || "",
    detail: item.detail || "",
    quantity: item.quantity ?? null,
    status: item.status,
    auto_comment: item.autoComment || "",
    parent_comment: item.parentComment || "",
    created_at: item.createdAt,
    resolved_at: item.resolvedAt || null,
  };
}

function fromDbSubmission(row) {
  return {
    id: row.id,
    childId: row.child_id,
    missionId: row.mission_id,
    missionName: row.mission_name,
    categoryId: row.category_id,
    categoryName: row.category_name || "",
    basePoints: Number(row.base_points || 0),
    requestedPoints: Number(row.requested_points || 0),
    approvedPoints: row.approved_points === null ? undefined : Number(row.approved_points || 0),
    multiplier: Number(row.multiplier || 1),
    boostLabel: row.boost_label || "",
    detail: row.detail || "",
    quantity: row.quantity,
    status: row.status,
    autoComment: row.auto_comment || "",
    parentComment: row.parent_comment || "",
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

function toDbRewardRequest(item) {
  const allowance = state.allowanceLedger.find((entry) => entry.rewardRequestId === item.id);
  return {
    id: item.id,
    child_id: item.childId,
    reward_id: item.rewardId,
    reward_name: item.rewardName,
    points: Number(item.points || 0),
    yen: Number(item.yen || 0),
    status: item.status,
    allowance_status: item.allowanceStatus || allowance?.status || (item.status === "approved" && Number(item.yen || 0) > 0 ? "unpaid" : null),
    paid_at: item.paidAt || allowance?.paidAt || null,
    created_at: item.createdAt,
    resolved_at: item.resolvedAt || null,
  };
}

function fromDbRewardRequest(row) {
  return {
    id: row.id,
    childId: row.child_id,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    points: Number(row.points || 0),
    yen: Number(row.yen || 0),
    status: row.status,
    allowanceStatus: row.allowance_status || undefined,
    paidAt: row.paid_at || undefined,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at || undefined,
  };
}

function allowanceFromRewardRequest(request) {
  return {
    id: `allowance-${request.id}`,
    childId: request.childId,
    rewardRequestId: request.id,
    rewardName: request.rewardName,
    amount: Number(request.yen || 0),
    status: request.allowanceStatus || "unpaid",
    createdAt: request.resolvedAt || request.createdAt,
    paidAt: request.paidAt || null,
  };
}

function fromDbPointHistory(row) {
  return {
    id: row.id,
    childId: row.child_id,
    type: row.type,
    points: Number(row.points || 0),
    description: row.description,
    categoryId: row.category_id || undefined,
    submissionId: row.submission_id || undefined,
    rewardRequestId: row.reward_request_id || undefined,
    comment: row.comment || "",
    createdAt: row.created_at,
  };
}

function toDbPointHistory(item) {
  return {
    id: item.id,
    child_id: item.childId,
    type: item.type,
    points: Number(item.points || 0),
    description: item.description,
    category_id: item.categoryId || null,
    submission_id: item.submissionId || null,
    reward_request_id: item.rewardRequestId || null,
    comment: item.comment || "",
    created_at: item.createdAt,
  };
}

function fromDbGacha(row) {
  return {
    id: row.id,
    childId: row.child_id,
    date: row.date,
    prizeId: row.prize_id,
    label: row.label,
    type: row.type,
    categoryId: row.category_id || "",
    multiplier: Number(row.multiplier || 1),
    points: Number(row.points || 0),
    createdAt: row.created_at,
  };
}

function toDbGacha(item) {
  return {
    id: item.id,
    child_id: item.childId,
    date: item.date,
    prize_id: item.prizeId,
    label: item.label,
    type: item.type,
    category_id: item.categoryId || "",
    multiplier: Number(item.multiplier || 1),
    points: Number(item.points || 0),
    created_at: item.createdAt,
  };
}

function prizeToRpcPayload(prize) {
  return {
    id: prize.id,
    label: prize.label,
    type: prize.type,
    categoryId: prize.categoryId || "",
    multiplier: prize.multiplier || 1,
    points: prize.points || 0,
  };
}

function handleAppError(error) {
  console.error(error);
  const message = String(error.message || "");
  if (message.includes("points_not_enough")) {
    showToast("承認に必要なポイントが足りません");
    return;
  }
  showToast(message || "保存に失敗しました");
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatDate(value) {
  return DATE_FORMAT.format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function childById(childId) {
  return state.children.find((child) => child.id === childId);
}

function categoryById(categoryId) {
  return state.categories.find((category) => category.id === categoryId);
}

function missionById(missionId) {
  return state.missions.find((mission) => mission.id === missionId);
}

function rewardById(rewardId) {
  return state.rewards.find((reward) => reward.id === rewardId);
}

function pointsLabel(mission) {
  if (mission.kind === "quantity") {
    return `1${mission.unitLabel}=${mission.unitPoints}pt / 上限${mission.maxUnits}${mission.unitLabel}`;
  }
  if (mission.kind === "duration") {
    return `${mission.unitStep}${mission.unitLabel}=${mission.unitPoints}pt / 上限${mission.maxPoints}pt`;
  }
  return `${mission.points}pt`;
}

function basePointsForMission(mission, value) {
  if (mission.kind === "quantity") {
    const units = Math.max(1, Math.min(Number(value || 1), mission.maxUnits || 20));
    return {
      basePoints: Math.min(units * Number(mission.unitPoints || 0), Number(mission.maxPoints || Infinity)),
      detail: `${units}${mission.unitLabel}`,
      quantity: units,
    };
  }
  if (mission.kind === "duration") {
    const minutes = Math.max(Number(mission.unitStep || 10), Number(value || mission.unitStep || 10));
    const blocks = Math.floor(minutes / Number(mission.unitStep || 10));
    return {
      basePoints: Math.min(blocks * Number(mission.unitPoints || 0), Number(mission.maxPoints || Infinity)),
      detail: `${minutes}${mission.unitLabel}`,
      quantity: minutes,
    };
  }
  return {
    basePoints: Number(mission.points || 0),
    detail: "",
    quantity: null,
  };
}

function todayGacha(childId) {
  return state.gachaHistory.find((entry) => entry.childId === childId && entry.date === todayKey());
}

function boostForCategory(childId, categoryId) {
  const entry = todayGacha(childId);
  if (!entry || entry.type !== "boost") return null;
  if (entry.categoryId === "all" || entry.categoryId === categoryId) return entry;
  return null;
}

function boostedPoints(childId, categoryId, basePoints) {
  const boost = boostForCategory(childId, categoryId);
  const multiplier = boost ? Number(boost.multiplier || 1) : 1;
  return {
    boost,
    multiplier,
    points: Math.round(Number(basePoints || 0) * multiplier),
  };
}

function pendingMissionCount(childId) {
  return state.submissions.filter((item) => item.childId === childId && item.status === "pending").length;
}

function pendingRewardCount(childId) {
  return state.rewardRequests.filter((item) => item.childId === childId && item.status === "pending").length;
}

function monthlyEarned(childId) {
  const currentMonth = monthKey();
  return state.pointHistory
    .filter((item) => item.childId === childId && item.points > 0 && item.createdAt.slice(0, 7) === currentMonth)
    .reduce((sum, item) => sum + Number(item.points || 0), 0);
}

function nextRewardInfo(child) {
  const rewards = [...state.rewards].sort((a, b) => Number(a.points) - Number(b.points));
  const next = rewards.find((reward) => Number(reward.points) > Number(child.points));
  if (!next) return { label: "交換できるごほうびがあります", points: 0 };
  return { label: `${next.name}まであと${Number(next.points) - Number(child.points)}pt`, points: Number(next.points) - Number(child.points) };
}

function statusLabel(status) {
  return {
    pending: "承認待ち",
    approved: "承認済み",
    rejected: "却下",
    unpaid: "未払い",
    paid: "もらった",
  }[status] || status;
}

function showToast(message) {
  ui.toast = message;
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toast = "";
    render();
  }, 2600);
  render();
}

function render() {
  if (!ui.session) {
    root.innerHTML = renderLogin();
    return;
  }
  root.innerHTML = ui.session.role === "parent" ? renderParentApp() : renderChildApp();
  if (ui.toast) {
    root.insertAdjacentHTML("beforeend", `<div class="toast">${escapeHtml(ui.toast)}</div>`);
  }
  if (ui.modal) {
    root.insertAdjacentHTML("beforeend", renderModal());
  }
}

function renderLogin() {
  const isChild = ui.loginMode === "child";
  const selected = childById(ui.selectedChildId) || state.children[0];
  return `
    <main class="login-wrap">
      <section class="login-copy">
        <h1>お手伝いアプリ</h1>
        <p>できたことを申請して、親が承認するとポイントになります。ガチャの今日のブースト、ごほうび交換、おこづかいの未払い管理まで Ver1 の流れをまとめました。</p>
      </section>
      <section class="login-panel">
        <div class="mode-switch" role="tablist" aria-label="ログイン種別">
          <button class="${isChild ? "active" : ""}" data-action="login-mode" data-mode="child">子ども</button>
          <button class="${!isChild ? "active" : ""}" data-action="login-mode" data-mode="parent">親</button>
        </div>
        <form class="form" data-action="login">
          ${
            isChild
              ? `
                <label class="field">
                  <span>ユーザー</span>
                  <select name="childId">
                    ${state.children.map((child) => `<option value="${child.id}" ${child.id === selected.id ? "selected" : ""}>${escapeHtml(child.name)}</option>`).join("")}
                  </select>
                </label>
                <label class="field">
                  <span>4桁PIN</span>
                  <input name="pin" inputmode="numeric" autocomplete="current-password" maxlength="4" pattern="[0-9]{4}" placeholder="1111" required />
                </label>
              `
              : `
                <label class="field">
                  <span>6桁PIN</span>
                  <input name="pin" inputmode="numeric" autocomplete="current-password" maxlength="6" pattern="[0-9]{6}" placeholder="123456" required />
                </label>
              `
          }
          <button class="button primary" type="submit"><span class="icon">→</span>ログイン</button>
        </form>
        <div class="hint">初期PIN: 親 123456 / Aくん 1111 / Bちゃん 2222<br />保存先: ${escapeHtml(syncStatusLabel())}</div>
      </section>
    </main>
  `;
}

function renderChildApp() {
  const child = childById(ui.session.childId);
  if (!child) {
    ui.session = null;
    return renderLogin();
  }
  const needsGacha = !todayGacha(child.id);
  if (needsGacha && !ui.modal) {
    ui.modal = { type: "gacha", childId: child.id, result: null };
  }
  return `
    <div class="app-shell">
      ${renderTopbar(`${escapeHtml(child.name)}のホーム`, `${child.points}pt`, true)}
      <main class="main">
        ${renderChildContent(child)}
      </main>
      ${renderBottomNav()}
    </div>
  `;
}

function renderTopbar(title, subtitle, isChild) {
  return `
    <header class="topbar">
      <div class="brand">
        <strong>${title}</strong>
        <span>${subtitle}</span>
      </div>
      <div class="top-actions">
        <span class="sync-pill ${remote.status}">${escapeHtml(syncStatusLabel())}</span>
        ${
          isChild
            ? `<button class="button pay" data-action="open-gacha" ${todayGacha(ui.session.childId) ? "" : ""}><span class="icon">◇</span>今日のガチャ</button>`
            : ""
        }
        <button class="button ghost" data-action="logout"><span class="icon">×</span>ログアウト</button>
      </div>
    </header>
  `;
}

function renderChildContent(child) {
  if (ui.childTab === "missions") return renderChildMissions(child);
  if (ui.childTab === "rewards") return renderChildRewards(child);
  if (ui.childTab === "history") return renderChildHistory(child);
  return renderChildHome(child);
}

function renderChildHome(child) {
  const boost = todayGacha(child.id);
  const next = nextRewardInfo(child);
  return `
    <section class="stack">
      <div class="section-head">
        <div>
          <h2>今日もひとつずつ</h2>
          <span class="subtle">${todayKey()} の状況</span>
        </div>
      </div>
      <div class="grid four auto">
        <div class="stat teal"><span>現在ポイント</span><strong>${child.points}pt</strong></div>
        <div class="stat blue"><span>今月の獲得</span><strong>${monthlyEarned(child.id)}pt</strong></div>
        <div class="stat green"><span>次のごほうび</span><strong>${escapeHtml(next.label)}</strong></div>
        <div class="stat amber"><span>承認待ち</span><strong>${pendingMissionCount(child.id) + pendingRewardCount(child.id)}件</strong></div>
      </div>
      <div class="wide-row">
        <div class="meta">
          <strong>今日のブースト</strong>
          <span>${boost ? escapeHtml(boost.label) : "まだガチャを回していません"}</span>
        </div>
        <button class="button primary" data-action="open-gacha"><span class="icon">◇</span>ガチャ</button>
      </div>
      <div class="section-head">
        <h3>カテゴリ</h3>
      </div>
      <div class="grid auto">
        ${state.categories.map((category) => renderCategoryButton(category)).join("")}
      </div>
    </section>
  `;
}

function renderCategoryButton(category) {
  const count = state.missions.filter((mission) => mission.categoryId === category.id).length;
  return `
    <button class="button category-button" data-action="select-mission-category" data-category-id="${category.id}" data-color="${category.color}">
      <span>
        <strong>${escapeHtml(category.name)}</strong><br />
        <span class="subtle">${count}個のミッション</span>
      </span>
    </button>
  `;
}

function renderChildMissions(child) {
  const activeCategory = categoryById(ui.missionCategory) || state.categories[0];
  const missions = state.missions.filter((mission) => mission.categoryId === activeCategory.id);
  const boost = boostForCategory(child.id, activeCategory.id);
  return `
    <section class="stack">
      <div class="section-head">
        <div>
          <h2>ミッション申請</h2>
          <span class="subtle">${boost ? `${boost.label} が適用されます` : "できたミッションを選んで申請"}</span>
        </div>
      </div>
      <div class="tab-row">
        ${state.categories.map((category) => `<button class="${category.id === activeCategory.id ? "active" : ""}" data-action="mission-category" data-category-id="${category.id}">${escapeHtml(category.name)}</button>`).join("")}
      </div>
      <div class="grid auto">
        ${missions.map((mission) => renderMissionCard(child, mission)).join("")}
      </div>
    </section>
  `;
}

function renderMissionCard(child, mission) {
  const base = basePointsForMission(mission, mission.kind === "duration" ? mission.unitStep : 1);
  const preview = boostedPoints(child.id, mission.categoryId, base.basePoints);
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(mission.name)}</h3>
          <p>${escapeHtml(mission.description)}</p>
        </div>
        <span class="badge strong">${pointsLabel(mission)}</span>
      </div>
      <form class="inline-form" data-action="submit-mission" data-mission-id="${mission.id}">
        ${renderMissionInput(mission)}
        <div class="wide-row">
          <div class="meta">
            <strong>申請ポイント</strong>
            <span data-preview-for="${mission.id}">${preview.points}pt${preview.multiplier > 1 ? ` (ブースト×${preview.multiplier})` : ""}</span>
          </div>
          <button class="button primary" type="submit"><span class="icon">✓</span>申請</button>
        </div>
      </form>
    </article>
  `;
}

function renderMissionInput(mission) {
  if (mission.kind === "quantity") {
    return `
      <label class="field">
        <span>枚数</span>
        <input name="quantity" data-action="mission-preview" data-mission-id="${mission.id}" type="number" min="1" max="${mission.maxUnits}" step="1" value="1" />
      </label>
    `;
  }
  if (mission.kind === "duration") {
    const unitPoints = Number(mission.unitPoints || 0);
    const maxMinutes = unitPoints > 0
      ? Math.floor(Number(mission.maxPoints || 30) / unitPoints) * Number(mission.unitStep || 10)
      : Number(mission.unitStep || 10);
    return `
      <label class="field">
        <span>時間</span>
        <input name="quantity" data-action="mission-preview" data-mission-id="${mission.id}" type="number" min="${mission.unitStep}" max="${maxMinutes}" step="${mission.unitStep}" value="${mission.unitStep}" />
      </label>
    `;
  }
  return "";
}

function renderChildRewards(child) {
  const pending = state.rewardRequests.filter((item) => item.childId === child.id && item.status === "pending");
  return `
    <section class="stack">
      <div class="section-head">
        <div>
          <h2>ごほうび交換所</h2>
          <span class="subtle">現在 ${child.points}pt / ${state.settings.exchangeRateLabel}</span>
        </div>
      </div>
      ${pending.length ? `<div class="wide-row"><div class="meta"><strong>交換申請中</strong><span>${pending.length}件が親の承認待ちです</span></div></div>` : ""}
      <div class="grid auto">
        ${state.rewards.map((reward) => renderRewardCard(child, reward)).join("")}
      </div>
    </section>
  `;
}

function renderRewardCard(child, reward) {
  const enough = Number(child.points) >= Number(reward.points);
  const pending = state.rewardRequests.some((item) => item.childId === child.id && item.rewardId === reward.id && item.status === "pending");
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(reward.name)}</h3>
          <p>${reward.yen ? `${reward.yen}円のおこづかい` : "特別ごほうび"}</p>
        </div>
        <span class="badge strong">${reward.points}pt</span>
      </div>
      <button class="button primary" data-action="request-reward" data-reward-id="${reward.id}" ${!enough || pending ? "disabled" : ""}>
        <span class="icon">→</span>${pending ? "申請中" : enough ? "交換申請" : `あと${Number(reward.points) - Number(child.points)}pt`}
      </button>
    </article>
  `;
}

function renderChildHistory(child) {
  return `
    <section class="stack">
      <div class="section-head">
        <h2>履歴</h2>
      </div>
      <div class="tab-row">
        ${[
          ["points", "ポイント履歴"],
          ["rewards", "ごほうび履歴"],
          ["pending", "承認待ち"],
        ].map(([id, label]) => `<button class="${ui.historyTab === id ? "active" : ""}" data-action="child-history-tab" data-tab="${id}">${label}</button>`).join("")}
      </div>
      ${renderChildHistoryPanel(child)}
    </section>
  `;
}

function renderChildHistoryPanel(child) {
  if (ui.historyTab === "rewards") {
    const requests = state.rewardRequests.filter((item) => item.childId === child.id).sort(byNewest);
    const paid = state.allowanceLedger.filter((item) => item.childId === child.id && item.status === "paid").sort(byNewestPaid);
    return `
      <div class="stack">
        ${requests.length ? requests.map(renderRewardRequestRow).join("") : renderEmpty("ごほうび履歴はまだありません")}
        ${paid.length ? `<div class="section-head"><h3>もらった履歴</h3></div>${paid.map(renderAllowanceRow).join("")}` : ""}
      </div>
    `;
  }
  if (ui.historyTab === "pending") {
    const missionPending = state.submissions.filter((item) => item.childId === child.id && item.status === "pending").sort(byNewest);
    const rewardPending = state.rewardRequests.filter((item) => item.childId === child.id && item.status === "pending").sort(byNewest);
    const rows = [...missionPending.map(renderSubmissionRow), ...rewardPending.map(renderRewardRequestRow)];
    return rows.length ? `<div class="stack">${rows.join("")}</div>` : renderEmpty("承認待ちはありません");
  }
  const history = state.pointHistory.filter((item) => item.childId === child.id).sort(byNewest);
  return history.length ? `<div class="stack">${history.map(renderPointHistoryRow).join("")}</div>` : renderEmpty("ポイント履歴はまだありません");
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="子どもメニュー">
      ${[
        ["home", "ホーム"],
        ["missions", "ミッション"],
        ["rewards", "ごほうび"],
        ["history", "履歴"],
      ].map(([id, label]) => `<button class="${ui.childTab === id ? "active" : ""}" data-action="child-tab" data-tab="${id}">${label}</button>`).join("")}
    </nav>
  `;
}

function renderParentApp() {
  return `
    <div class="app-shell">
      ${renderTopbar("親画面", renderParentSubtitle(), false)}
      <main class="main">
        <nav class="parent-nav" aria-label="親メニュー">
          ${[
            ["dashboard", "ダッシュボード"],
            ["approvals", "承認待ち"],
            ["missions", "ミッション管理"],
            ["rewards", "ごほうび管理"],
            ["history", "履歴"],
            ["settings", "設定"],
          ].map(([id, label]) => `<button class="button ${ui.parentTab === id ? "primary" : ""}" data-action="parent-tab" data-tab="${id}">${label}</button>`).join("")}
        </nav>
        ${renderParentContent()}
      </main>
    </div>
  `;
}

function renderParentSubtitle() {
  const approvals = state.submissions.filter((item) => item.status === "pending").length;
  const rewards = state.rewardRequests.filter((item) => item.status === "pending").length;
  return `ミッション${approvals}件 / 交換${rewards}件が承認待ち`;
}

function renderParentContent() {
  if (ui.parentTab === "approvals") return renderParentApprovals();
  if (ui.parentTab === "missions") return renderMissionManagement();
  if (ui.parentTab === "rewards") return renderRewardManagement();
  if (ui.parentTab === "history") return renderParentHistory();
  if (ui.parentTab === "settings") return renderSettings();
  return renderParentDashboard();
}

function renderParentDashboard() {
  const pendingMissions = state.submissions.filter((item) => item.status === "pending").length;
  const pendingRewards = state.rewardRequests.filter((item) => item.status === "pending").length;
  const unpaidTotal = state.allowanceLedger.filter((item) => item.status === "unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const monthTotal = state.pointHistory.filter((item) => item.points > 0 && item.createdAt.slice(0, 7) === monthKey()).reduce((sum, item) => sum + Number(item.points || 0), 0);
  return `
    <section class="stack">
      <div class="section-head">
        <h2>ダッシュボード</h2>
      </div>
      <div class="grid four auto">
        <div class="stat teal"><span>承認待ち</span><strong>${pendingMissions}件</strong></div>
        <div class="stat blue"><span>交換申請</span><strong>${pendingRewards}件</strong></div>
        <div class="stat amber"><span>未払いおこづかい</span><strong>${unpaidTotal}円</strong></div>
        <div class="stat green"><span>今月の獲得合計</span><strong>${monthTotal}pt</strong></div>
      </div>
      <div class="section-head">
        <h3>子ども別</h3>
      </div>
      <div class="grid auto">
        ${state.children.map(renderChildSummary).join("")}
      </div>
      ${renderUnpaidAllowance()}
    </section>
  `;
}

function renderChildSummary(child) {
  const unpaid = state.allowanceLedger.filter((item) => item.childId === child.id && item.status === "unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(child.name)}</h3>
          <p>今月 ${monthlyEarned(child.id)}pt / 承認待ち ${pendingMissionCount(child.id) + pendingRewardCount(child.id)}件</p>
        </div>
        <span class="badge strong">${child.points}pt</span>
      </div>
      <div class="money-row">
        <span class="subtle">未払いおこづかい</span>
        <strong>${unpaid}円</strong>
      </div>
    </article>
  `;
}

function renderUnpaidAllowance() {
  const unpaid = state.allowanceLedger.filter((item) => item.status === "unpaid").sort(byNewest);
  if (!unpaid.length) return "";
  const byChild = state.children.map((child) => ({
    child,
    total: unpaid.filter((item) => item.childId === child.id).reduce((sum, item) => sum + Number(item.amount || 0), 0),
  })).filter((entry) => entry.total > 0);
  const total = byChild.reduce((sum, entry) => sum + entry.total, 0);
  return `
    <section class="stack">
      <div class="section-head">
        <h3>おこづかい管理</h3>
        <button class="button pay" data-action="mark-allowance-paid"><span class="icon">✓</span>まとめてあげた</button>
      </div>
      <div class="card">
        <div class="money-list">
          ${byChild.map(({ child, total: childTotal }) => `<div class="money-row"><span>${escapeHtml(child.name)}</span><strong>${childTotal}円</strong></div>`).join("")}
          <div class="money-row"><span>合計</span><strong>${total}円</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderParentApprovals() {
  const submissions = state.submissions.filter((item) => item.status === "pending").sort(byNewest);
  const rewardRequests = state.rewardRequests.filter((item) => item.status === "pending").sort(byNewest);
  return `
    <section class="stack">
      <div class="section-head">
        <h2>承認待ち</h2>
      </div>
      <div class="section-head"><h3>ミッション申請</h3></div>
      ${submissions.length ? submissions.map(renderApprovalCard).join("") : renderEmpty("ミッション申請はありません")}
      <div class="section-head"><h3>ごほうび交換申請</h3></div>
      ${rewardRequests.length ? rewardRequests.map(renderRewardApprovalCard).join("") : renderEmpty("交換申請はありません")}
    </section>
  `;
}

function renderApprovalCard(item) {
  const child = childById(item.childId);
  const category = categoryById(item.categoryId);
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(item.missionName)}</h3>
          <p>${escapeHtml(child?.name || "")} / ${escapeHtml(category?.name || "")} / ${formatDate(item.createdAt)} ${item.detail ? `/ ${escapeHtml(item.detail)}` : ""}</p>
        </div>
        <span class="badge strong">${item.requestedPoints}pt</span>
      </div>
      <p>${escapeHtml(item.autoComment)}</p>
      <form class="inline-form" data-action="approve-mission" data-submission-id="${item.id}">
        <div class="approval-tools">
          <label class="field">
            <span>承認pt</span>
            <input name="points" type="number" min="0" step="1" value="${item.requestedPoints}" />
          </label>
          <label class="field">
            <span>自由コメント</span>
            <input name="comment" placeholder="任意" />
          </label>
        </div>
        <div class="actions">
          <button class="button primary" type="submit"><span class="icon">✓</span>承認</button>
          <button class="button danger" type="button" data-action="reject-mission" data-submission-id="${item.id}"><span class="icon">×</span>却下</button>
        </div>
      </form>
    </article>
  `;
}

function renderRewardApprovalCard(item) {
  const child = childById(item.childId);
  return `
    <article class="card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(item.rewardName)}</h3>
          <p>${escapeHtml(child?.name || "")} / ${formatDate(item.createdAt)}</p>
        </div>
        <span class="badge strong">${item.points}pt</span>
      </div>
      <div class="actions">
        <button class="button primary" data-action="approve-reward" data-request-id="${item.id}"><span class="icon">✓</span>承認</button>
        <button class="button danger" data-action="reject-reward" data-request-id="${item.id}"><span class="icon">×</span>却下</button>
      </div>
    </article>
  `;
}

function renderMissionManagement() {
  return `
    <section class="stack">
      <div class="section-head">
        <h2>ミッション管理</h2>
      </div>
      <div class="tab-row">
        ${state.categories.map((category) => `<button class="${ui.missionCategory === category.id ? "active" : ""}" data-action="mission-category" data-category-id="${category.id}">${escapeHtml(category.name)}</button>`).join("")}
      </div>
      <div class="grid auto">
        ${state.missions.filter((mission) => mission.categoryId === ui.missionCategory).map(renderMissionManagementCard).join("")}
      </div>
    </section>
  `;
}

function renderMissionManagementCard(mission) {
  return `
    <form class="card inline-form" data-action="save-mission" data-mission-id="${mission.id}">
      <label class="field">
        <span>表示名</span>
        <input name="name" value="${escapeHtml(mission.name)}" required />
      </label>
      <label class="field">
        <span>詳細説明</span>
        <textarea name="description" required>${escapeHtml(mission.description)}</textarea>
      </label>
      ${renderMissionManagementPointFields(mission)}
      <button class="button primary" type="submit"><span class="icon">✓</span>保存</button>
    </form>
  `;
}

function renderMissionManagementPointFields(mission) {
  if (mission.kind === "quantity") {
    return `
      <div class="row">
        <label class="field"><span>1${escapeHtml(mission.unitLabel)}あたりpt</span><input name="unitPoints" type="number" min="0" step="1" value="${mission.unitPoints}" /></label>
        <label class="field"><span>上限${escapeHtml(mission.unitLabel)}</span><input name="maxUnits" type="number" min="1" step="1" value="${mission.maxUnits}" /></label>
      </div>
      <label class="field"><span>上限pt</span><input name="maxPoints" type="number" min="0" step="1" value="${mission.maxPoints}" /></label>
    `;
  }
  if (mission.kind === "duration") {
    return `
      <div class="row">
        <label class="field"><span>${mission.unitStep}${escapeHtml(mission.unitLabel)}あたりpt</span><input name="unitPoints" type="number" min="0" step="1" value="${mission.unitPoints}" /></label>
        <label class="field"><span>上限pt</span><input name="maxPoints" type="number" min="0" step="1" value="${mission.maxPoints}" /></label>
      </div>
    `;
  }
  return `<label class="field"><span>pt</span><input name="points" type="number" min="0" step="1" value="${mission.points}" /></label>`;
}

function renderRewardManagement() {
  return `
    <section class="stack">
      <div class="section-head">
        <h2>ごほうび管理</h2>
      </div>
      <div class="grid auto">
        ${state.rewards.map(renderRewardManagementCard).join("")}
      </div>
      <form class="card inline-form" data-action="add-reward">
        <div class="section-head"><h3>特別ごほうびを追加</h3></div>
        <div class="row">
          <label class="field"><span>ごほうび名</span><input name="name" required /></label>
          <label class="field"><span>必要pt</span><input name="points" type="number" min="1" step="1" required /></label>
        </div>
        <label class="field"><span>おこづかい金額（任意）</span><input name="yen" type="number" min="0" step="1" placeholder="0" /></label>
        <button class="button primary" type="submit"><span class="icon">＋</span>追加</button>
      </form>
    </section>
  `;
}

function renderRewardManagementCard(reward) {
  return `
    <form class="card inline-form" data-action="save-reward" data-reward-id="${reward.id}">
      <label class="field"><span>ごほうび</span><input name="name" value="${escapeHtml(reward.name)}" required /></label>
      <div class="row">
        <label class="field"><span>必要pt</span><input name="points" type="number" min="1" step="1" value="${reward.points}" /></label>
        <label class="field"><span>おこづかい金額</span><input name="yen" type="number" min="0" step="1" value="${reward.yen || 0}" /></label>
      </div>
      <div class="actions">
        <button class="button primary" type="submit"><span class="icon">✓</span>保存</button>
        ${reward.fixed ? "" : `<button class="button danger" type="button" data-action="delete-reward" data-reward-id="${reward.id}"><span class="icon">×</span>削除</button>`}
      </div>
    </form>
  `;
}

function renderSettings() {
  const probabilityTotal = state.settings.gachaPrizes.reduce((sum, prize) => sum + Number(prize.probability || 0), 0);
  return `
    <section class="stack">
      <div class="section-head">
        <h2>設定</h2>
      </div>
      <form class="card inline-form" data-action="save-settings">
        <div class="settings-block">
          <div class="section-head"><h3>PINとポイント</h3></div>
          <div class="row">
            <label class="field"><span>親PIN（6桁）</span><input name="parentPin" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" value="${escapeHtml(state.settings.parentPin)}" required /></label>
            <label class="field"><span>ポイント換算表示</span><input name="exchangeRateLabel" value="${escapeHtml(state.settings.exchangeRateLabel)}" required /></label>
          </div>
          ${state.children.map((child) => `
            <div class="row">
              <label class="field"><span>子ども名</span><input name="childName:${child.id}" value="${escapeHtml(child.name)}" required /></label>
              <label class="field"><span>4桁PIN</span><input name="childPin:${child.id}" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" value="${escapeHtml(child.pin)}" required /></label>
            </div>
          `).join("")}
        </div>
        <div class="settings-block">
          <div class="section-head"><h3>定型コメント</h3></div>
          ${state.categories.map((category) => `
            <label class="field">
              <span>${escapeHtml(category.name)}</span>
              <input name="comment:${category.id}" value="${escapeHtml(state.settings.comments[category.id] || "")}" />
            </label>
          `).join("")}
        </div>
        <div class="settings-block">
          <div class="section-head">
            <h3>ガチャ確率</h3>
            <span class="badge ${probabilityTotal === 100 ? "strong" : ""}">合計 ${probabilityTotal}%</span>
          </div>
          ${state.settings.gachaPrizes.map((prize) => `
            <label class="prob-row">
              <span>${escapeHtml(prize.label)}</span>
              <input class="compact-input" name="probability:${prize.id}" type="number" min="0" step="1" value="${prize.probability}" />
            </label>
          `).join("")}
        </div>
        <button class="button primary" type="submit"><span class="icon">✓</span>設定を保存</button>
      </form>
    </section>
  `;
}

function renderParentHistory() {
  return `
    <section class="stack">
      <div class="section-head">
        <h2>履歴</h2>
      </div>
      <div class="tab-row">
        ${[
          ["approvals", "承認履歴"],
          ["allowance", "おこづかい履歴"],
          ["points", "ポイント履歴"],
          ["monthly", "月間集計"],
          ["total", "累計集計"],
        ].map(([id, label]) => `<button class="${ui.parentHistoryTab === id ? "active" : ""}" data-action="parent-history-tab" data-tab="${id}">${label}</button>`).join("")}
      </div>
      ${renderParentHistoryPanel()}
    </section>
  `;
}

function renderParentHistoryPanel() {
  if (ui.parentHistoryTab === "allowance") {
    const rows = [...state.allowanceLedger].sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt));
    return rows.length ? `<div class="stack">${rows.map(renderAllowanceRow).join("")}</div>` : renderEmpty("おこづかい履歴はまだありません");
  }
  if (ui.parentHistoryTab === "points") {
    const rows = [...state.pointHistory].sort(byNewest);
    return rows.length ? `<div class="stack">${rows.map(renderPointHistoryRow).join("")}</div>` : renderEmpty("ポイント履歴はまだありません");
  }
  if (ui.parentHistoryTab === "monthly") {
    return renderAggregate(monthKey());
  }
  if (ui.parentHistoryTab === "total") {
    return renderAggregate(null);
  }
  const rows = [...state.submissions].filter((item) => item.status !== "pending").sort((a, b) => new Date(b.resolvedAt || b.createdAt) - new Date(a.resolvedAt || a.createdAt));
  return rows.length ? `<div class="stack">${rows.map(renderSubmissionRow).join("")}</div>` : renderEmpty("承認履歴はまだありません");
}

function renderAggregate(month) {
  const rows = state.children.map((child) => {
    const histories = state.pointHistory.filter((item) => item.childId === child.id && (!month || item.createdAt.slice(0, 7) === month));
    const earned = histories.filter((item) => item.points > 0).reduce((sum, item) => sum + Number(item.points), 0);
    const used = histories.filter((item) => item.points < 0).reduce((sum, item) => sum + Math.abs(Number(item.points)), 0);
    return `
      <div class="wide-row">
        <div class="meta">
          <strong>${escapeHtml(child.name)}</strong>
          <span>${month ? `${month} の集計` : "累計集計"}</span>
        </div>
        <div class="actions">
          <span class="badge strong">獲得 ${earned}pt</span>
          <span class="badge">使用 ${used}pt</span>
          <span class="badge">残高 ${child.points}pt</span>
        </div>
      </div>
    `;
  }).join("");
  return `<div class="stack">${rows}</div>`;
}

function renderSubmissionRow(item) {
  const child = childById(item.childId);
  return `
    <div class="wide-row">
      <div class="meta">
        <strong>${escapeHtml(item.missionName)}</strong>
        <span>${escapeHtml(child?.name || "")} / ${formatDate(item.createdAt)}${item.detail ? ` / ${escapeHtml(item.detail)}` : ""}</span>
      </div>
      <div class="actions">
        <span class="badge">${item.approvedPoints ?? item.requestedPoints}pt</span>
        <span class="status ${item.status}">${statusLabel(item.status)}</span>
      </div>
    </div>
  `;
}

function renderRewardRequestRow(item) {
  const child = childById(item.childId);
  return `
    <div class="wide-row">
      <div class="meta">
        <strong>${escapeHtml(item.rewardName)}</strong>
        <span>${escapeHtml(child?.name || "")} / ${formatDate(item.createdAt)}</span>
      </div>
      <div class="actions">
        <span class="badge">${item.points}pt</span>
        <span class="status ${item.status}">${statusLabel(item.status)}</span>
      </div>
    </div>
  `;
}

function renderPointHistoryRow(item) {
  const child = childById(item.childId);
  const positive = Number(item.points) >= 0;
  return `
    <div class="wide-row">
      <div class="meta">
        <strong>${escapeHtml(item.description)}</strong>
        <span>${escapeHtml(child?.name || "")} / ${formatDate(item.createdAt)}${item.comment ? ` / ${escapeHtml(item.comment)}` : ""}</span>
      </div>
      <span class="badge ${positive ? "strong" : ""}">${positive ? "+" : ""}${item.points}pt</span>
    </div>
  `;
}

function renderAllowanceRow(item) {
  const child = childById(item.childId);
  return `
    <div class="wide-row">
      <div class="meta">
        <strong>${escapeHtml(item.rewardName)}</strong>
        <span>${escapeHtml(child?.name || "")} / ${item.status === "paid" ? formatDate(item.paidAt || item.createdAt) : formatDate(item.createdAt)}</span>
      </div>
      <div class="actions">
        <span class="badge strong">${item.amount}円</span>
        <span class="status ${item.status}">${statusLabel(item.status)}</span>
      </div>
    </div>
  `;
}

function renderEmpty(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

function renderModal() {
  if (ui.modal?.type !== "gacha") return "";
  const child = childById(ui.modal.childId);
  const result = ui.modal.result;
  return `
    <div class="modal-layer fullscreen">
      <section class="modal-box gacha-box" role="dialog" aria-modal="true" aria-label="今日のガチャ">
        <h2 class="gacha-title">今日のガチャ</h2>
        ${
          result
            ? `
              <div class="gacha-prize">
                <span class="subtle">${escapeHtml(child?.name || "")}の結果</span>
                <strong>${escapeHtml(result.label)}</strong>
                <p>${result.type === "points" ? "ポイントを追加しました" : "今日のミッション申請にブーストがかかります"}</p>
              </div>
              <button class="button primary" data-action="close-modal"><span class="icon">✓</span>ホームへ</button>
            `
            : `
              <p>${escapeHtml(child?.name || "")}は今日まだ回していません。</p>
              <button class="button primary" data-action="draw-gacha" data-child-id="${ui.modal.childId}"><span class="icon">◇</span>回す</button>
            `
        }
      </section>
    </div>
  `;
}

function byNewest(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function byNewestPaid(a, b) {
  return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt);
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form");
  if (!form) return;
  const action = form.dataset.action;
  if (!action) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    if (action === "login") await handleLogin(data);
    if (action === "submit-mission") await submitMission(form.dataset.missionId, data);
    if (action === "approve-mission") await approveMission(form.dataset.submissionId, data);
    if (action === "save-mission") await saveMission(form.dataset.missionId, data);
    if (action === "save-reward") await saveReward(form.dataset.rewardId, data);
    if (action === "add-reward") await addReward(data);
    if (action === "save-settings") await saveSettings(data);
  } catch (error) {
    handleAppError(error);
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (button.tagName === "FORM") return;
  try {
    if (action === "login-mode") {
      ui.loginMode = button.dataset.mode;
      render();
    }
    if (action === "logout") {
      ui.session = null;
      ui.modal = null;
      render();
    }
    if (action === "child-tab") {
      ui.childTab = button.dataset.tab;
      render();
    }
    if (action === "parent-tab") {
      ui.parentTab = button.dataset.tab;
      render();
    }
    if (action === "mission-category") {
      ui.missionCategory = button.dataset.categoryId;
      render();
    }
    if (action === "select-mission-category") {
      ui.missionCategory = button.dataset.categoryId;
      ui.childTab = "missions";
      render();
    }
    if (action === "child-history-tab") {
      ui.historyTab = button.dataset.tab;
      render();
    }
    if (action === "parent-history-tab") {
      ui.parentHistoryTab = button.dataset.tab;
      render();
    }
    if (action === "open-gacha") openGacha();
    if (action === "draw-gacha") await drawGacha(button.dataset.childId);
    if (action === "close-modal") {
      ui.modal = null;
      render();
    }
    if (action === "reject-mission") await rejectMission(button.dataset.submissionId);
    if (action === "request-reward") await requestReward(button.dataset.rewardId);
    if (action === "approve-reward") await approveReward(button.dataset.requestId);
    if (action === "reject-reward") await rejectReward(button.dataset.requestId);
    if (action === "mark-allowance-paid") await markAllowancePaid();
    if (action === "delete-reward") await deleteReward(button.dataset.rewardId);
  } catch (error) {
    handleAppError(error);
  }
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-action='mission-preview']");
  if (!input || !ui.session || ui.session.role !== "child") return;
  const mission = missionById(input.dataset.missionId);
  const previewTarget = document.querySelector(`[data-preview-for="${input.dataset.missionId}"]`);
  if (!mission || !previewTarget) return;
  const base = basePointsForMission(mission, input.value);
  const preview = boostedPoints(ui.session.childId, mission.categoryId, base.basePoints);
  previewTarget.textContent = `${preview.points}pt${preview.multiplier > 1 ? ` (ブースト×${preview.multiplier})` : ""}`;
});

async function handleLogin(data) {
  if (remote.enabled) {
    await refreshRemoteState({ quiet: true });
  }
  if (ui.loginMode === "parent") {
    if (data.pin !== state.settings.parentPin) {
      showToast("親PINが違います");
      return;
    }
    ui.session = { role: "parent" };
    ui.parentTab = "dashboard";
    render();
    return;
  }
  const child = childById(data.childId);
  if (!child || data.pin !== child.pin) {
    showToast("子どもPINが違います");
    return;
  }
  ui.selectedChildId = child.id;
  ui.session = { role: "child", childId: child.id };
  ui.childTab = "home";
  ui.modal = todayGacha(child.id) ? null : { type: "gacha", childId: child.id, result: null };
  render();
}

async function submitMission(missionId, data) {
  const childId = ui.session?.childId;
  const mission = missionById(missionId);
  if (!childId || !mission) return;
  const base = basePointsForMission(mission, data.quantity);
  const boosted = boostedPoints(childId, mission.categoryId, base.basePoints);
  const category = categoryById(mission.categoryId);
  const item = {
    id: uid("submission"),
    childId,
    missionId: mission.id,
    missionName: mission.name,
    categoryId: mission.categoryId,
    categoryName: category?.name || "",
    basePoints: base.basePoints,
    requestedPoints: boosted.points,
    multiplier: boosted.multiplier,
    boostLabel: boosted.boost?.label || "",
    detail: base.detail,
    quantity: base.quantity,
    status: "pending",
    autoComment: state.settings.comments[mission.categoryId] || "",
    parentComment: "",
    createdAt: new Date().toISOString(),
  };
  if (remote.enabled) {
    await expectOk(remote.client.from("submissions").insert(toDbSubmission(item)));
    await refreshRemoteState({ quiet: true });
  } else {
    state.submissions.push(item);
    saveState();
  }
  showToast("ミッションを申請しました");
}

async function approveMission(submissionId, data) {
  const item = state.submissions.find((submission) => submission.id === submissionId);
  const child = item && childById(item.childId);
  if (!item || !child || item.status !== "pending") return;
  const approvedPoints = Math.max(0, Number(data.points || 0));
  if (remote.enabled) {
    await callRpc("approve_mission", {
      p_submission_id: submissionId,
      p_approved_points: approvedPoints,
      p_parent_comment: data.comment || "",
    });
    await refreshRemoteState({ quiet: true });
    showToast("承認しました");
    return;
  }
  item.status = "approved";
  item.approvedPoints = approvedPoints;
  item.parentComment = data.comment || "";
  item.resolvedAt = new Date().toISOString();
  child.points = Number(child.points || 0) + approvedPoints;
  state.pointHistory.push({
    id: uid("point"),
    childId: child.id,
    type: "mission",
    points: approvedPoints,
    description: item.missionName,
    categoryId: item.categoryId,
    submissionId: item.id,
    comment: [item.autoComment, item.parentComment].filter(Boolean).join(" "),
    createdAt: item.resolvedAt,
  });
  saveState();
  showToast("承認しました");
}

async function rejectMission(submissionId) {
  const item = state.submissions.find((submission) => submission.id === submissionId);
  if (!item || item.status !== "pending") return;
  if (remote.enabled) {
    await callRpc("reject_mission", { p_submission_id: submissionId });
    await refreshRemoteState({ quiet: true });
    showToast("却下しました");
    return;
  }
  item.status = "rejected";
  item.approvedPoints = 0;
  item.resolvedAt = new Date().toISOString();
  saveState();
  showToast("却下しました");
}

async function requestReward(rewardId) {
  if (remote.enabled) {
    await refreshRemoteState({ quiet: true });
  }
  const child = childById(ui.session?.childId);
  const reward = rewardById(rewardId);
  if (!child || !reward) return;
  if (Number(child.points) < Number(reward.points)) {
    showToast("ポイントが足りません");
    return;
  }
  const request = {
    id: uid("reward-request"),
    childId: child.id,
    rewardId: reward.id,
    rewardName: reward.name,
    points: Number(reward.points),
    yen: Number(reward.yen || 0),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (remote.enabled) {
    await expectOk(remote.client.from("reward_requests").insert(toDbRewardRequest(request)));
    await refreshRemoteState({ quiet: true });
  } else {
    state.rewardRequests.push(request);
    saveState();
  }
  showToast("ごほうび交換を申請しました");
}

async function approveReward(requestId) {
  const request = state.rewardRequests.find((item) => item.id === requestId);
  const child = request && childById(request.childId);
  if (!request || !child || request.status !== "pending") return;
  if (remote.enabled) {
    await callRpc("approve_reward", { p_request_id: requestId });
    await refreshRemoteState({ quiet: true });
    showToast("交換申請を承認しました");
    return;
  }
  if (Number(child.points) < Number(request.points)) {
    showToast("承認に必要なポイントが足りません");
    return;
  }
  request.status = "approved";
  request.resolvedAt = new Date().toISOString();
  child.points = Number(child.points) - Number(request.points);
  state.pointHistory.push({
    id: uid("point"),
    childId: child.id,
    type: "reward",
    points: -Number(request.points),
    description: `${request.rewardName}と交換`,
    rewardRequestId: request.id,
    createdAt: request.resolvedAt,
  });
  if (Number(request.yen || 0) > 0) {
    state.allowanceLedger.push({
      id: uid("allowance"),
      childId: child.id,
      rewardRequestId: request.id,
      rewardName: request.rewardName,
      amount: Number(request.yen),
      status: "unpaid",
      createdAt: request.resolvedAt,
      paidAt: null,
    });
  }
  saveState();
  showToast("交換申請を承認しました");
}

async function rejectReward(requestId) {
  const request = state.rewardRequests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") return;
  if (remote.enabled) {
    await callRpc("reject_reward", { p_request_id: requestId });
    await refreshRemoteState({ quiet: true });
    showToast("交換申請を却下しました");
    return;
  }
  request.status = "rejected";
  request.resolvedAt = new Date().toISOString();
  saveState();
  showToast("交換申請を却下しました");
}

async function markAllowancePaid() {
  if (remote.enabled) {
    const count = await callRpc("mark_allowances_paid", {});
    await refreshRemoteState({ quiet: true });
    showToast(count ? "未払いおこづかいをもらった履歴にしました" : "未払いはありません");
    return;
  }
  const now = new Date().toISOString();
  let count = 0;
  for (const item of state.allowanceLedger) {
    if (item.status === "unpaid") {
      item.status = "paid";
      item.paidAt = now;
      count += 1;
    }
  }
  saveState();
  showToast(count ? "未払いおこづかいをもらった履歴にしました" : "未払いはありません");
}

function openGacha() {
  const childId = ui.session?.childId;
  if (!childId) return;
  const today = todayGacha(childId);
  ui.modal = {
    type: "gacha",
    childId,
    result: today || null,
  };
  render();
}

async function drawGacha(childId) {
  const child = childById(childId);
  if (!child) return;
  const existing = todayGacha(childId);
  if (existing) {
    ui.modal = { type: "gacha", childId, result: existing };
    render();
    return;
  }
  const prize = choosePrize();
  if (remote.enabled) {
    const row = await callRpc("record_gacha", {
      p_child_id: childId,
      p_prize: prizeToRpcPayload(prize),
      p_date: todayKey(),
    });
    const entry = fromDbGacha(row);
    await refreshRemoteState({ quiet: true });
    ui.modal = { type: "gacha", childId, result: entry };
    render();
    return;
  }
  const entry = {
    id: uid("gacha"),
    childId,
    date: todayKey(),
    prizeId: prize.id,
    label: prize.label,
    type: prize.type,
    categoryId: prize.categoryId || "",
    multiplier: prize.multiplier || 1,
    points: prize.points || 0,
    createdAt: new Date().toISOString(),
  };
  state.gachaHistory.push(entry);
  if (prize.type === "points") {
    child.points = Number(child.points || 0) + Number(prize.points || 0);
    state.pointHistory.push({
      id: uid("point"),
      childId,
      type: "gacha",
      points: Number(prize.points || 0),
      description: "ガチャ景品",
      comment: prize.label,
      createdAt: entry.createdAt,
    });
  }
  saveState();
  ui.modal = { type: "gacha", childId, result: entry };
  render();
}

function choosePrize() {
  const prizes = state.settings.gachaPrizes;
  const total = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.probability || 0)), 0);
  if (total <= 0) return prizes[0];
  let roll = Math.random() * total;
  for (const prize of prizes) {
    roll -= Math.max(0, Number(prize.probability || 0));
    if (roll <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}

async function saveMission(missionId, data) {
  const mission = missionById(missionId);
  if (!mission) return;
  const nextMission = { ...mission, name: data.name.trim(), description: data.description.trim() };
  if (nextMission.kind === "quantity") {
    nextMission.unitPoints = Number(data.unitPoints || 0);
    nextMission.maxUnits = Math.max(1, Number(data.maxUnits || 1));
    nextMission.maxPoints = Number(data.maxPoints || 0);
  } else if (nextMission.kind === "duration") {
    nextMission.unitPoints = Number(data.unitPoints || 0);
    nextMission.maxPoints = Number(data.maxPoints || 0);
  } else {
    nextMission.points = Number(data.points || 0);
  }
  if (remote.enabled) {
    await expectOk(remote.client.from("missions").update(toDbMission(nextMission, state.missions.indexOf(mission))).eq("id", mission.id));
    await refreshRemoteState({ quiet: true });
  } else {
    Object.assign(mission, nextMission);
    saveState();
  }
  showToast("ミッションを保存しました");
}

async function saveReward(rewardId, data) {
  const reward = rewardById(rewardId);
  if (!reward) return;
  const nextReward = {
    ...reward,
    name: data.name.trim(),
    points: Math.max(1, Number(data.points || 1)),
    yen: Math.max(0, Number(data.yen || 0)),
  };
  if (remote.enabled) {
    await expectOk(remote.client.from("rewards").update(toDbReward(nextReward, state.rewards.indexOf(reward))).eq("id", reward.id));
    await refreshRemoteState({ quiet: true });
  } else {
    Object.assign(reward, nextReward);
    saveState();
  }
  showToast("ごほうびを保存しました");
}

async function addReward(data) {
  const reward = {
    id: uid("reward"),
    name: data.name.trim(),
    points: Math.max(1, Number(data.points || 1)),
    yen: Math.max(0, Number(data.yen || 0)),
    fixed: false,
  };
  if (remote.enabled) {
    await expectOk(remote.client.from("rewards").insert(toDbReward(reward, state.rewards.length)));
    await refreshRemoteState({ quiet: true });
  } else {
    state.rewards.push(reward);
    saveState();
  }
  showToast("特別ごほうびを追加しました");
}

async function deleteReward(rewardId) {
  const reward = rewardById(rewardId);
  if (!reward || reward.fixed) return;
  if (remote.enabled) {
    await expectOk(remote.client.from("rewards").delete().eq("id", rewardId));
    await refreshRemoteState({ quiet: true });
  } else {
    state.rewards = state.rewards.filter((item) => item.id !== rewardId);
    saveState();
  }
  showToast("特別ごほうびを削除しました");
}

async function saveSettings(data) {
  const parentPin = String(data.parentPin || "").slice(0, 6);
  if (!/^\d{6}$/.test(parentPin)) {
    showToast("親PINは6桁の数字にしてください");
    return;
  }
  const nextChildPins = state.children.map((child) => ({
    child,
    pin: String(data[`childPin:${child.id}`] || child.pin).slice(0, 4),
  }));
  if (nextChildPins.some((entry) => !/^\d{4}$/.test(entry.pin))) {
    showToast("子どもPINは4桁の数字にしてください");
    return;
  }
  const nextSettings = {
    ...state.settings,
    parentPin,
    exchangeRateLabel: data.exchangeRateLabel || "100pt = 100円",
    comments: { ...state.settings.comments },
    gachaPrizes: state.settings.gachaPrizes.map((prize) => ({
      ...prize,
      probability: Math.max(0, Number(data[`probability:${prize.id}`] || 0)),
    })),
  };
  for (const category of state.categories) {
    nextSettings.comments[category.id] = data[`comment:${category.id}`] || "";
  }
  const nextChildren = state.children.map((child) => ({
    ...child,
    name: data[`childName:${child.id}`]?.trim() || child.name,
    pin: nextChildPins.find((entry) => entry.child.id === child.id).pin,
  }));
  if (remote.enabled) {
    await expectOk(remote.client.from("settings").upsert(toDbSettings(nextSettings), { onConflict: "id" }));
    await Promise.all(nextChildren.map((child, index) => expectOk(
      remote.client
        .from("children")
        .update({ name: child.name, pin: child.pin, sort_order: index })
        .eq("id", child.id),
    )));
    await refreshRemoteState({ quiet: true });
    showToast("設定を保存しました");
    return;
  }
  state.settings = nextSettings;
  state.children = nextChildren;
  for (const prize of state.settings.gachaPrizes) {
    prize.probability = Math.max(0, Number(data[`probability:${prize.id}`] || 0));
  }
  saveState();
  showToast("設定を保存しました");
}

void initializeApp();
