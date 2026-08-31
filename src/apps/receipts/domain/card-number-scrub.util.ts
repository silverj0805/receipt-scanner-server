// 영수증 OCR 원문(rawText)에 카드번호(대개 POS가 이미 일부 마스킹해서 찍어줌, 예: "5300-12**-****-6789")가
// 그대로 남아있을 수 있음 — 한국 개인정보보호법 시행령은 카드/계좌번호를 저장 시 암호화하도록
// 요구하므로, 저장 전에 카드번호로 추정되는 부분을 가려서 DB에는 마스킹된 형태만 남김.
//
// ⚠️ best-effort 방어임을 명시: OCR이 마스킹 문자(*, x, •)를 다른 글자로 잘못 인식하는 경우가
// 흔해서(예: "53275075*x^") 카드번호가 항상 깔끔한 4-4-4-4 형식으로 인식되지 않음 — 그래서
// "숫자/마스킹기호 비중이 높은 8자 이상 토큰"이라는 느슨한 휴리스틱으로 최대한 넓게 잡되,
// 100% 탐지를 보장하진 않음(정규식 기반 스크러빙의 근본적 한계).
const MASK_TOKEN_MIN_LENGTH = 8;
const DIGIT_OR_MASK_CHAR = /[\d*xX•]/;
const DIGIT_OR_MASK_DENSITY_THRESHOLD = 0.7;
const REDACTED_PLACEHOLDER = '[카드번호 마스킹됨]';

// 영수증에 흔한 YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD 형태의 날짜는 숫자 비중이 높아서
// 카드번호 휴리스틱에 오탐지되기 쉬움 — 명시적으로 제외.
const DATE_LIKE_PATTERN = /^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/;

function isLikelyCardNumberToken(token: string): boolean {
  if (token.length < MASK_TOKEN_MIN_LENGTH) return false;
  if (DATE_LIKE_PATTERN.test(token)) return false;

  const digitCount = [...token].filter((c) => /\d/.test(c)).length;
  if (digitCount < 6) return false; // 숫자가 거의 없으면(단순 마스킹기호 나열 등) 카드번호가 아닐 가능성이 높음

  const maskedCharCount = [...token].filter((c) => DIGIT_OR_MASK_CHAR.test(c)).length;
  return maskedCharCount / token.length >= DIGIT_OR_MASK_DENSITY_THRESHOLD;
}

export function scrubCardNumbers(text: string): string {
  return text
    .split(/(\s+)/) // 공백을 구분자로 캡처해서 join 시 원래 공백을 그대로 복원
    .map((token) => (isLikelyCardNumberToken(token) ? REDACTED_PLACEHOLDER : token))
    .join('');
}
