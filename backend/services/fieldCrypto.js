/**
 * 受取口座の暗号化（AES-256-GCM）
 *
 * 口座番号などをDBに「読めない形」で保存する。鍵は .env の PAYOUT_ENC_KEY にだけあり、
 * DBにもバックアップ（サーバー内・S3・PCの月次控え）にも入らない。
 * そのため、DBやバックアップが盗まれても口座番号は読めない。
 *
 * 保存形式: "enc:v1:" + base64(iv 12バイト | 認証タグ 16バイト | 暗号文)
 * 先頭が "enc:v1:" でない値は暗号化前の古いデータとみなし、そのまま返す
 * （scripts/encrypt-payout-details.js で一括暗号化するまでの移行期間用）。
 *
 * 鍵を失うと暗号化済みの口座は二度と読めない。その場合は受取人に口座を登録し直してもらう。
 * 鍵の作り方: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

const crypto = require('crypto');

const PREFIX = 'enc:v1:';

// 暗号化する項目。名義・銀行名・国・通貨は管理画面の一覧で使うので平文のまま
const PAYOUT_SECRET_FIELDS = ['account_number', 'branch_info', 'extra_info', 'beneficiary_address'];

let cachedKey = null;
function getKey() {
    if (cachedKey) return cachedKey;
    const raw = process.env.PAYOUT_ENC_KEY;
    if (!raw) throw new Error('PAYOUT_ENC_KEY is not set');
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) throw new Error('PAYOUT_ENC_KEY must be 32 bytes (base64)');
    cachedKey = key;
    return key;
}

function isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * 暗号化。null・空文字はそのまま（「未入力」を区別するため）。
 * 鍵が無いときは例外にする。黙って平文で保存するよりは、保存に失敗する方がよい
 */
function encryptField(value) {
    if (value == null || value === '') return value;
    if (isEncrypted(value)) return value;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const body = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}

function decryptField(value) {
    if (!isEncrypted(value)) return value;
    const buf = Buffer.from(value.slice(PREFIX.length), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

/** 口座情報のオブジェクト（DBの行・支払い控えのJSON）の秘密項目だけを暗号化/復号した写しを返す */
function encryptPayoutDetails(obj) {
    if (!obj) return obj;
    const out = { ...obj };
    for (const f of PAYOUT_SECRET_FIELDS) {
        if (f in out) out[f] = encryptField(out[f]);
    }
    return out;
}

function decryptPayoutDetails(obj) {
    if (!obj) return obj;
    const out = { ...obj };
    for (const f of PAYOUT_SECRET_FIELDS) {
        if (f in out) out[f] = decryptField(out[f]);
    }
    return out;
}

module.exports = {
    PAYOUT_SECRET_FIELDS,
    isEncrypted,
    encryptField,
    decryptField,
    encryptPayoutDetails,
    decryptPayoutDetails
};
