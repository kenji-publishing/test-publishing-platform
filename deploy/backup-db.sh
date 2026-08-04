#!/bin/bash
# AuctLect データベースの日次バックアップ
#
# Lightsail の自動スナップショット（03:00 UTC）より前に走らせることで、
# 毎日のスナップショットの中に「その日の整合の取れたダンプ」が必ず含まれるようにしている。
# スナップショットだけだと電源断相当の複製になるため、pg_dump と併用する。
#
# 復元:  pg_restore -d auctlect_db --clean --if-exists <ファイル>
# 中身確認: pg_restore --list <ファイル>

set -uo pipefail

ENV_FILE="/home/ubuntu/auctlect/backend/.env"
BACKUP_DIR="/home/ubuntu/backups"
LOG="$BACKUP_DIR/backup.log"
KEEP_DAYS=30
NOTIFY="/home/ubuntu/backup-notify.js"

mkdir -p "$BACKUP_DIR"

log() { echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC')  $*" >> "$LOG"; }

fail() {
  log "NG  $1"
  # 失敗したことを知らせる。メール送信自体が落ちてもログには残す
  if [ -f "$NOTIFY" ]; then
    (cd /home/ubuntu/auctlect/backend && node "$NOTIFY" "$1" >> "$LOG" 2>&1) || log "NG  通知メールも送れませんでした"
  fi
  exit 1
}

# .env から必要な値だけ取り出す。
# `. .env` で読み込むと EMAIL_FROM=AuctLect <noreply@...> の < をリダイレクトと解釈して
# そこで読み込みが止まってしまうため、シェルには解釈させず1行ずつ抜き出す。
[ -f "$ENV_FILE" ] || fail ".env が見つかりません: $ENV_FILE"

getenv() {
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | tr -d '\r' \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

DB_HOST="$(getenv DB_HOST)"
DB_PORT="$(getenv DB_PORT)"
DB_NAME="$(getenv DB_NAME)"
DB_USER="$(getenv DB_USER)"
DB_PASSWORD="$(getenv DB_PASSWORD)"

[ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] \
  || fail ".env から接続情報を読み取れませんでした"

STAMP="$(date -u '+%Y-%m-%d_%H%M')"
OUT="$BACKUP_DIR/auctlect_db_${STAMP}.dump"

export PGPASSWORD="$DB_PASSWORD"

# -Fc = 圧縮済みのカスタム形式。pg_restore で個別テーブルだけ戻すこともできる
if ! pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
     -Fc --no-owner --no-acl -f "$OUT" 2>>"$LOG"; then
  rm -f "$OUT"
  fail "pg_dump が失敗しました"
fi

unset PGPASSWORD

# 「ファイルはあるが中身が壊れている」を防ぐため、実際に読み戻せるか確かめる
SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
[ "$SIZE" -gt 10240 ] || fail "ダンプが小さすぎます（${SIZE} バイト）: $OUT"

TABLES=$(pg_restore --list "$OUT" 2>>"$LOG" | grep -c "TABLE DATA") || TABLES=0
[ "$TABLES" -gt 0 ] || fail "ダンプにテーブルが入っていません: $OUT"

# 古いものを片付ける
DELETED=$(find "$BACKUP_DIR" -name 'auctlect_db_*.dump' -mtime +$KEEP_DAYS -print -delete | wc -l)

log "OK  $(basename "$OUT")  $(numfmt --to=iec "$SIZE")  テーブル${TABLES}件  削除${DELETED}件"
