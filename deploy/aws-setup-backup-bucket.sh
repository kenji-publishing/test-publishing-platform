#!/bin/bash
# 消せないバックアップ置き場（S3 Object Lock）を作る
#
# AWSコンソール右上の CloudShell（リージョン: ロンドン eu-west-2）で1回だけ実行する。
# 何度実行しても壊れない（作成済みのものは飛ばす）。
#
# できるもの:
#   - バケット auctlect-backups-<アカウント番号>（ロンドン）
#       置いたファイルは COMPLIANCE モードで30日間、だれにも消せない・書き換えられない。
#       管理者でもルートユーザーでもAWSのサポートでも消せない。ランサムウェア対策の本体。
#       31日目に自動で片付くので、置き場の大きさは約1か月分で止まる。
#   - IAMユーザー auctlect-backup-writer（サーバーが使う）
#       できるのは「置く」「一覧を見る」「ロックが掛かったか確かめる」だけ。
#       読む・消す・ロックを外す はできない。サーバーが乗っ取られても控えは守られる。
#   - そのユーザーのアクセスキー（最後に1回だけ画面に出る）
#
# 注意: COMPLIANCE モードは取り消せない。置いたファイルは30日間、本当に消せない
#       （料金は1か月分で月数円。誤って大きなファイルを置いた場合も30日は残る）。

set -euo pipefail

REGION="eu-west-2"
DAYS=30
USER_NAME="auctlect-backup-writer"

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="auctlect-backups-${ACCOUNT}"

echo "バケット: $BUCKET（$REGION）"

# 1. バケット（Object Lock はバケット作成時にしか有効にできない）
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "  作成済み"
else
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=$REGION" \
    --object-lock-enabled-for-bucket > /dev/null
  echo "  作成しました"
fi

# 2. 外部公開を完全に禁止
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 3. 置いたものは30日間消せない（COMPLIANCE）
aws s3api put-object-lock-configuration --bucket "$BUCKET" \
  --object-lock-configuration \
  "{\"ObjectLockEnabled\":\"Enabled\",\"Rule\":{\"DefaultRetention\":{\"Mode\":\"COMPLIANCE\",\"Days\":$DAYS}}}"

# 4. ロックが切れたら片付ける（31日目に消す印 → その翌日に本体を消す）
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration '{
    "Rules": [
      {"ID": "expire-after-lock", "Status": "Enabled", "Filter": {"Prefix": ""},
       "Expiration": {"Days": 31},
       "NoncurrentVersionExpiration": {"NoncurrentDays": 1},
       "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}},
      {"ID": "cleanup-delete-markers", "Status": "Enabled", "Filter": {"Prefix": ""},
       "Expiration": {"ExpiredObjectDeleteMarker": true}}
    ]
  }'

# 5. 暗号化されていない通信を拒否
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"DenyInsecureTransport\", \"Effect\": \"Deny\", \"Principal\": \"*\",
    \"Action\": \"s3:*\",
    \"Resource\": [\"arn:aws:s3:::$BUCKET\", \"arn:aws:s3:::$BUCKET/*\"],
    \"Condition\": {\"Bool\": {\"aws:SecureTransport\": \"false\"}}
  }]
}"
echo "  ロック30日・自動片付け・公開禁止 を設定しました"

# 6. サーバー用のユーザー（置くだけ）
if aws iam get-user --user-name "$USER_NAME" > /dev/null 2>&1; then
  echo "ユーザー $USER_NAME: 作成済み"
else
  aws iam create-user --user-name "$USER_NAME" > /dev/null
  echo "ユーザー $USER_NAME: 作成しました"
fi

aws iam put-user-policy --user-name "$USER_NAME" --policy-name "put-backups-only" \
  --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {\"Sid\": \"PutOnly\", \"Effect\": \"Allow\",
     \"Action\": [\"s3:PutObject\", \"s3:GetObjectRetention\"],
     \"Resource\": \"arn:aws:s3:::$BUCKET/*\"},
    {\"Sid\": \"ListForChecks\", \"Effect\": \"Allow\",
     \"Action\": \"s3:ListBucket\",
     \"Resource\": \"arn:aws:s3:::$BUCKET\"}
  ]
}"
echo "  権限: 置く・一覧・ロック確認 のみ"

# 7. アクセスキー（すでにあれば作らない。秘密キーは作った時にしか見られない）
KEYS="$(aws iam list-access-keys --user-name "$USER_NAME" --query 'length(AccessKeyMetadata)' --output text)"
if [ "$KEYS" != "0" ]; then
  echo
  echo "アクセスキーはすでにあります。作り直す場合はIAMの画面で古いキーを削除してから再実行してください。"
  exit 0
fi

read -r KEY_ID SECRET < <(aws iam create-access-key --user-name "$USER_NAME" \
  --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)

echo
echo "================ サーバーに入れるキー（この画面にしか出ません）================"
echo "  AWS Access Key ID     : $KEY_ID"
echo "  AWS Secret Access Key : $SECRET"
echo "  Default region name   : $REGION"
echo "  Default output format : json"
echo "=========================================================================="
echo "※ チャットやメールには貼らないでください。サーバーの aws configure にだけ入れます。"
