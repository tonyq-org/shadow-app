import {sdJwtDecode} from '../services/protocol/sdjwt';

export interface CardDisplayFields {
  holder?: string;
  idNumber?: string;
  picture?: string;
  subject: Record<string, unknown>;
}

const HOLDER_KEYS = [
  'name',
  'full_name',
  'fullName',
  'holder',
  'holder_name',
  'displayName',
];
const FAMILY_KEYS = ['family_name', 'familyName', 'last_name', 'surname'];
const GIVEN_KEYS = ['given_name', 'givenName', 'first_name', 'forename'];
const ID_KEYS = [
  'id_number',
  'idNumber',
  'national_id',
  'document_number',
  'documentNumber',
  'serial_number',
  'serialNumber',
  'member_no',
  'memberNo',
  'card_number',
  'cardNumber',
];
const PICTURE_KEYS = ['picture', 'photo', 'portrait', 'image', 'avatar'];

function findCaseInsensitive(
  subject: Record<string, unknown>,
  keys: string[],
): string | undefined {
  const lowered = new Map(
    Object.keys(subject).map(k => [k.toLowerCase(), k] as const),
  );
  for (const want of keys) {
    const actual = lowered.get(want.toLowerCase());
    if (actual !== undefined) {
      const v = subject[actual];
      if (v !== null && v !== undefined && v !== '') return String(v);
    }
  }
  return undefined;
}

function decodeSubject(rawJwt: string): Record<string, unknown> {
  try {
    const decoded = sdJwtDecode(rawJwt);
    const payload = decoded.payload as Record<string, unknown>;
    const vc = (payload.vc as Record<string, unknown>) ?? payload;
    return (vc.credentialSubject as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

// Per OID4VCI §11.2.3, `display.background_image.uri` (and `logo.uri`) should
// be either an https URL returning image bytes, or a `data:` URI inline in the
// metadata JSON. The TW government issuer returns an https URL whose body is a
// `data:image/...;base64,...` string with Content-Type: text/plain — neither
// form. Handle all three shapes; fall back to undefined on error so a cosmetic
// fetch failure never blocks credential issuance.
export async function resolveDisplayImage(
  uri: string | undefined,
): Promise<string | undefined> {
  if (!uri) return undefined;
  if (uri.startsWith('data:')) return uri;
  try {
    const res = await fetch(uri);
    if (!res.ok) return undefined;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.startsWith('image/')) return uri;
    const body = (await res.text()).trim();
    if (body.startsWith('data:image/')) return body;
    return undefined;
  } catch {
    return undefined;
  }
}

export function extractCardDisplay(rawJwt: string): CardDisplayFields {
  const subject = decodeSubject(rawJwt);

  const holder =
    findCaseInsensitive(subject, HOLDER_KEYS) ??
    (() => {
      const family = findCaseInsensitive(subject, FAMILY_KEYS);
      const given = findCaseInsensitive(subject, GIVEN_KEYS);
      if (family && given) return `${family} ${given}`;
      return family ?? given;
    })();

  const idNumber = findCaseInsensitive(subject, ID_KEYS);
  const picture = findCaseInsensitive(subject, PICTURE_KEYS);

  return {holder, idNumber, picture, subject};
}
