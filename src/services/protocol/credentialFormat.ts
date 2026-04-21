import {sdJwtDecode} from './sdjwt';

export type CredentialFormat = 'sd-jwt-vcdm' | 'sd-jwt-vc';

export const DEFAULT_CREDENTIAL_FORMAT: CredentialFormat = 'sd-jwt-vcdm';

/**
 * Classify an SD-JWT credential by data model.
 *
 *  - `sd-jwt-vc`  : IETF SD-JWT VC (`draft-ietf-oauth-sd-jwt-vc`). JWT `typ`
 *                   is `vc+sd-jwt` / `dc+sd-jwt`, or the payload carries a
 *                   top-level `vct` URI and claims are flat on the payload.
 *  - `sd-jwt-vcdm`: TWDIW-style hybrid — SD-JWT selective disclosure applied
 *                   to a W3C VCDM 1.1 envelope (`payload.vc.@context`, `.type`,
 *                   `.credentialSubject`).
 */
export function detectCredentialFormat(token: string): CredentialFormat {
  try {
    const {header, payload} = sdJwtDecode(token);
    const typ = (header.typ as string | undefined)?.toLowerCase();
    if (typ === 'vc+sd-jwt' || typ === 'dc+sd-jwt') return 'sd-jwt-vc';

    if (payload.vc && typeof payload.vc === 'object') return 'sd-jwt-vcdm';
    if (typeof payload.vct === 'string') return 'sd-jwt-vc';
  } catch {
    /* fall through to default */
  }
  return DEFAULT_CREDENTIAL_FORMAT;
}
