/**
 * 期日の一覧。scripts/deadline-reminders.js が毎日読んで、近づいたらメールで知らせる。
 *
 * 期日を足すときはここに1件書くだけ。済んだものは DONE に id を足すと、それ以降は鳴らない。
 * （OSS申告・確認書のように「出さないと罰金」のものは、DONE に入るまで期限後も毎日鳴り続ける）
 *
 * remind: 何日前に知らせるか。0 は当日。
 * overdue: true なら、期限を過ぎても毎日知らせる（届け出・申告など、済ませないと罰則があるもの）
 */

// 済ませたもの。id を足すと通知が止まる
const DONE = [
  'oss-2026-Q3',          // 2026-10-22 ゼロ申告を提出
];

const FILING = [30, 14, 7, 3, 1, 0];   // 届け出・申告
const RENEWAL = [30, 7, 1];            // 自動更新されるが、支払い元が生きているか確かめたいもの

// ---- 一度きりの期日 ----
const ONE_OFF = [
  {
    id: 'github-pat-2027-01',
    date: '2027-01-13',
    title: 'GitHubのトークン（PAT）の期限',
    what: 'kenjiさんのPCからGitHubへ変更を送る（push）ための合言葉の期限です。90日ごとに更新が必要です。',
    how: 'GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → トークン名 → Regenerate token（期限は90日）。'
       + '新しいトークンを Windows の「資格情報マネージャー」の git:https://github.com に保存し直し、'
       + '最後に Claude に「更新した」と伝えてください（書き込みの許可 Contents: Read and write が付いているか確かめます）。'
       + '※ 正確な期限は GitHub のトークン画面に表示されます。本番サイトには影響しません。',
    remind: [14, 7, 1, 0],
  },
  {
    id: 'myco-payment-2027',
    date: '2027-03-31',
    title: 'MYCO（登記住所）の支払い方法を個人カード → Starling に変更',
    what: '登記住所サービス（£49.99/年）の更新日は 2027年4月2日。今は失効した個人カードが登録されているため、このままだと更新の支払いが失敗します。',
    how: 'MYCO のアカウント画面（領収書メールの「Log in to your account」）で支払い方法を Starling のカードに変更。'
       + '新しいカードを追加 → 既定に設定 → 古いカードを削除、の順番で。',
    remind: [30, 14, 7, 3, 1, 0],
    overdue: true,
  },
  {
    id: 'ch-confirmation-2027',
    date: '2027-04-16',
    title: 'Companies House：確認書（Confirmation statement）の提出',
    what: '会社の情報（役員・株主・住所など）に変わりがないことを年1回届け出ます。初回は 2027年4月2日時点の内容で、4月16日が期限。'
       + '手数料 £50。遅れると会社の登記が抹消される手続きに進むことがあります。',
    how: 'Companies House の WebFiling（または GOV.UK「File your confirmation statement」）に、会社の認証コードでログインして提出。'
       + 'Claude に手順を聞いてもらえれば画面ごとに案内します。',
    remind: FILING,
    overdue: true,
  },
  {
    id: 'ch-accounts-2028',
    date: '2028-01-03',
    title: 'Companies House：初回の決算書の提出',
    what: '2026年4月3日〜2027年4月30日の決算書。期限を過ぎると自動で罰金（£150〜）。',
    how: '売上や経費があるので、休眠会社用の簡易版（dormant）は選ばないこと。会計士に頼むか、Claude と一緒に準備します。',
    remind: [60, 30, 14, 7, 3, 1, 0],
    overdue: true,
  },
  {
    id: 'ct-payment-2028',
    date: '2028-02-01',
    title: '法人税（Corporation Tax）の納付期限',
    what: '会計期間 2026-05-15〜2027-04-30 の法人税。赤字なら £0 の見込みですが、期限の確認は必要です。',
    how: 'HMRC のオンラインサービスで納付額を確認し、必要なら Starling から支払い。',
    remind: [30, 7, 1, 0],
    overdue: true,
  },
  {
    id: 'ct600-2028',
    date: '2028-04-30',
    title: '法人税の申告書（CT600）の提出',
    what: '会計期間 2026-05-15〜2027-04-30 の法人税申告。赤字でも提出は必要。遅れると罰金。',
    how: 'HMRC のオンラインサービス、または会計士経由で提出。',
    remind: [60, 30, 14, 7, 3, 1, 0],
    overdue: true,
  },
  {
    id: 'ros-cert-2028',
    date: '2028-07-20',
    title: 'ROS（アイルランド歳入庁）のデジタル証明書の更新（目安）',
    what: 'OSS申告に使う ROS の証明書 AuctLectOSS は 2026-08-20 に作成。証明書には有効期限があり、切れると申告できなくなります。'
       + '※ この日付は目安です。正確な期限は ROS にログインしたときの案内で確認してください。',
    how: 'ROS にログインすると更新の案内が出ます。更新後は新しい .p12.bac を C:\\ROS\\RosCerts\\ と Documents の2か所に保存し直すこと。',
    remind: [30, 7],
  },
];

// ---- 毎年くり返す期日（月, 日）。from を書いたものはその年から ----
// id には年が付く（例 'ch-confirmation-2028'）。DONE にはその形で入れる
const YEARLY = [
  {
    id: 'ch-confirmation',
    month: 4, day: 16, from: 2028,     // 初回(2027)は上の一度きりの方
    title: 'Companies House：確認書（Confirmation statement）の提出',
    what: '会社の情報に変わりがないことを年1回届け出ます（£50）。遅れると登記抹消の手続きに進むことがあります。',
    how: 'Companies House の WebFiling で提出。正確な期限は Companies House の会社ページに出ています。',
    remind: FILING,
    overdue: true,
  },
  {
    id: 'domain',
    month: 5, day: 15,
    title: 'ドメイン auctlect.com の更新（Cloudflare）',
    what: '自動更新ですが、支払いが失敗するとサイトもメールも止まります。',
    how: 'Cloudflare → Manage Account → Billing で、Starling のカードが有効か確認。',
    remind: RENEWAL,
  },
  {
    id: 'myco-renewal',
    month: 4, day: 2,
    title: 'MYCO（登記住所サービス）の年次更新',
    what: '£49.99/年。失効すると登記住所を失います。',
    how: 'MYCO のアカウント画面で支払い方法が Starling になっているか確認。',
    remind: RENEWAL,
  },
  {
    id: 'm365',
    month: 8, day: 1,
    title: 'Microsoft 365 の年次更新（info@auctlect.com の受信）',
    what: '£64.80/年。失効すると会社のメールが受け取れなくなります。',
    how: 'Microsoft 365 管理センター → 課金情報 → 支払い方法 で Starling のカードを確認。',
    remind: RENEWAL,
  },
];

module.exports = { DONE, ONE_OFF, YEARLY };
