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

# ---- 記録（月次報告で読む用） ----
{
  echo "点検日時: $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo "ディスク: ${DISK_PCT}% 使用 / 残り ${DISK_FREE}"
  echo "メモリ空き: ${MEM_AVAIL}MB"
  echo "作品ファイル: ${UPLOADS_H}"
  echo "データベース: ${DB_MB}MB"
  echo "直近30日の取引: ${TX30}件"
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
