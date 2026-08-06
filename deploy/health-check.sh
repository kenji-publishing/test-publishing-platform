#!/bin/bash
# サーバーの健康診断。
#
# 目的は「kenjiさんが毎日どこかを見に行かなくていい」ようにすること。
# ふだんは何も送らず、基準を超えたときだけメールで知らせる。
# 毎日届く正常メールは、すぐ読まれなくなって意味を失うため。
#
# 判定結果は常に health-latest.txt に残すので、月次の報告時に数字を拾える。

set -uo pipefail

BACKUP_DIR="/home/ubuntu/backups"
UPLOADS="/home/ubuntu/auctlect/backend/uploads"
STATE="$BACKUP_DIR/health-latest.txt"
NOTIFY="/home/ubuntu/auctlect/backend/health-notify.js"
ENV_FILE="/home/ubuntu/auctlect/backend/.env"

mkdir -p "$BACKUP_DIR"

getenv() {
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | tr -d '\r' \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

# ---- 測る ----
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
DISK_FREE=$(df -h --output=avail / | tail -1 | tr -d ' ')
MEM_AVAIL=$(free -m | awk '/^Mem:/{print $7}')
UPLOADS_MB=$(du -sm "$UPLOADS" 2>/dev/null | cut -f1)
UPLOADS_H=$(du -sh "$UPLOADS" 2>/dev/null | cut -f1)

export PGPASSWORD="$(getenv DB_PASSWORD)"
DB_HOST="$(getenv DB_HOST)"; DB_USER="$(getenv DB_USER)"; DB_NAME="$(getenv DB_NAME)"
PSQL="psql -h $DB_HOST -U $DB_USER -d $DB_NAME -tAc"

DB_MB=$($PSQL "SELECT round(pg_database_size(current_database())/1048576.0);" 2>/dev/null || echo 0)
TX30=$($PSQL "SELECT count(*) FROM transactions WHERE created_at > NOW() - INTERVAL '30 days';" 2>/dev/null || echo 0)

# 累計売上。通貨がJPY/USD/EUR…と混在するので、そのまま足すと意味のない数になる。
# ここでの目的は「専門家に相談すべき時期か」を測ることだけなので、
# おおよそのレートで£に換算する。会計の数字ではない。
# （為替は動くが、判断が数週間早いか遅いかの差にしかならない）
REV_GBP=$($PSQL "
  SELECT round(coalesce(sum(
    CASE upper(currency)
      WHEN 'GBP' THEN amount
      WHEN 'USD' THEN amount * 0.79
      WHEN 'EUR' THEN amount * 0.85
      WHEN 'JPY' THEN amount * 0.0052
      WHEN 'CNY' THEN amount * 0.11
      WHEN 'KRW' THEN amount * 0.00058
      WHEN 'BRL' THEN amount * 0.14
      WHEN 'CAD' THEN amount * 0.58
      WHEN 'AUD' THEN amount * 0.52
      WHEN 'AED' THEN amount * 0.21
      WHEN 'SAR' THEN amount * 0.21
      ELSE 0
    END
    * CASE transaction_type WHEN 'refund' THEN -1 ELSE 1 END
  ), 0))
  FROM transactions WHERE status = 'completed';" 2>/dev/null || echo 0)

# EU圏（27か国）の読者への販売。デジタル役務のEU向け販売はVATの論点が生じうるため、
# 1件でも発生したら知らせる。国が取れなかった取引は数えない（過小には出るが誤報はしない）。
EU_LIST="'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'"
EU_N=$($PSQL "SELECT count(*) FROM transactions
  WHERE status='completed' AND transaction_type='purchase'
    AND buyer_country IN ($EU_LIST);" 2>/dev/null || echo 0)
EU_COUNTRIES=$($PSQL "SELECT coalesce(string_agg(DISTINCT buyer_country, ','), '-') FROM transactions
  WHERE status='completed' AND transaction_type='purchase'
    AND buyer_country IN ($EU_LIST);" 2>/dev/null || echo '-')
UNKNOWN_N=$($PSQL "SELECT count(*) FROM transactions
  WHERE status='completed' AND transaction_type='purchase' AND buyer_country IS NULL;" 2>/dev/null || echo 0)
unset PGPASSWORD

LATEST=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  AGE_H=$(( ( $(date +%s) - $(stat -c %Y "$LATEST") ) / 3600 ))
else
  AGE_H=9999
fi

# ---- 判定 ----
# しきい値は「困る前に気づける」位置に置く。ぎりぎりで鳴らしても手遅れになる。
WARN=""
add() { WARN="${WARN}${1}"$'\n'; }

[ "$DISK_PCT" -ge 75 ] && add "・ディスクが ${DISK_PCT}% 埋まっています（残り ${DISK_FREE}）。作品ファイルをS3へ移すか、ディスクを大きくする時期です。"
[ "${MEM_AVAIL:-9999}" -lt 250 ] && add "・使えるメモリが ${MEM_AVAIL}MB まで減っています。データベースを別サーバーへ移す（管理型DB）検討時期です。"
[ "${DB_MB:-0}" -ge 2048 ] && add "・データベースが ${DB_MB}MB になりました。管理型DBへの移行を検討してください。"
[ "${TX30:-0}" -ge 300 ] && add "・直近30日の取引が ${TX30} 件（1日あたり10件超）。1日1回のバックアップでは、障害時に失う取引が無視できない量になります。管理型DB（5分刻みの巻き戻し）への移行時期です。"
[ "$AGE_H" -ge 72 ] && add "・最新のバックアップが ${AGE_H} 時間前のままです。日次バックアップが止まっている可能性があります。"

# --- 専門家に相談する時期の目安 ---
# 金額のしきい値は「相談料を売上で賄えるようになったか」で決めている。
# 早すぎると払えず、遅すぎると手遅れになる。
[ "${EU_N:-0}" -ge 1 ] && add "・EU圏の読者への販売が発生しました（${EU_N}件 / ${EU_COUNTRIES}）。EU向けのデジタル販売はVATの論点が生じます。会計士に相談する時期です。HMRCとアイルランドへの照会結果が届いていれば、あわせて見てもらってください。"
[ "${REV_GBP:-0}" -ge 2000 ] && add "・累計売上が約£${REV_GBP}になりました。会計士への相談（£150〜£400程度）を売上で賄える水準です。"
[ "${REV_GBP:-0}" -ge 5000 ] && add "・同じく£5,000を超えました。利用規約・ガイドラインの弁護士レビュー（£750〜£2,500程度）も検討する時期です。"

# ---- 記録（月次報告で読む用） ----
{
  echo "点検日時: $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "ディスク: ${DISK_PCT}% 使用 / 残り ${DISK_FREE}"
  echo "メモリ空き: ${MEM_AVAIL}MB"
  echo "作品ファイル: ${UPLOADS_H}"
  echo "データベース: ${DB_MB}MB"
  echo "直近30日の取引: ${TX30}件"
  echo "累計売上: 約£${REV_GBP}（概算・返金差引後）"
  echo "EU圏への販売: ${EU_N}件${EU_COUNTRIES:+ (${EU_COUNTRIES})}"
  echo "購入者の国が不明: ${UNKNOWN_N}件"
  echo "最新バックアップ: ${AGE_H}時間前"
  echo "判定: $([ -z "$WARN" ] && echo '問題なし' || echo '要対応')"
} > "$STATE"

# ---- 基準を超えたときだけ知らせる ----
if [ -n "$WARN" ]; then
  # 同じ内容を毎日送らない。前回と同じ警告なら7日に1回だけ。
  SEEN="$BACKUP_DIR/.health-warned"
  HASH=$(echo "$WARN" | md5sum | cut -c1-8)
  PREV=$(cut -d' ' -f1 "$SEEN" 2>/dev/null || echo "")
  PREV_AT=$(cut -d' ' -f2 "$SEEN" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  if [ "$HASH" != "$PREV" ] || [ $(( (NOW - PREV_AT) / 86400 )) -ge 7 ]; then
    (cd /home/ubuntu/auctlect/backend && node "$NOTIFY" "$WARN" "$(cat "$STATE")")
    echo "$HASH $NOW" > "$SEEN"
  fi
fi
