# Shadow Wallet

Open-source digital credential wallet built with React Native + TypeScript.

Inspired by [TWDIW (Taiwan Digital Wallet)](https://github.com/moda-gov-tw/TWDIW-official-app) from Taiwan's Ministry of Digital Affairs.

## What is this?

Shadow Wallet is a cross-platform mobile app for managing W3C Verifiable Credentials. It implements the OpenID4VCI / OpenID4VP protocols, allowing users to receive, store, and present digital credentials with selective disclosure.

This project rewrites the original TWDIW native apps (Kotlin + Swift + Flutter/Dart) into a single React Native codebase, making it easier to extend and deploy.

## Features

- **OID4VCI** — Receive verifiable credentials from issuers via QR code
- **OID4VP** — Present credentials to verifiers with selective disclosure (SD-JWT)
- **DID:key** — Decentralized identifier generation (P-256)
- **Hardware-backed signing** — Android KeyStore / iOS Secure Enclave (ES256)
- **Encrypted local storage** — SQLite + SQLCipher
- **Offline verification** — Verify credentials without network using downloaded trust lists
- **Biometric auth** — Face ID / Fingerprint login
- **NFC** — VP transmission via ISO-DEP (planned)
- **i18n** — Traditional Chinese (zh-TW) + English

## Architecture

```
src/
├── navigation/          # React Navigation (AuthStack + 5-tab MainTabs)
├── screens/             # 17 screens across auth, home, credential, presentation, settings
├── components/          # Reusable UI (CardItem, PinCodeInput, BottomSheet, etc.)
├── services/
│   ├── protocol/        # OID4VCI, OID4VP, SD-JWT, DID — ported from Dart
│   ├── crypto/          # JWT/JWS + native key management bridge
│   ├── verification/    # VC verification (online + offline) + status list
│   └── api/             # HTTP client + trust list integration
├── store/               # Zustand (auth, wallet, settings)
├── db/                  # SQLite schema + DAOs (wallet, credential, records)
├── native/              # Native module interfaces (KeyManager, Biometric, NFC)
├── hooks/               # useAutoLogout, useDeepLink, useWallet
└── utils/               # base64url, DER/Raw encoding, multicodec
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Android Studio (for Android) or Xcode (for iOS)

### Install

```sh
npm install
```

### Run

```sh
# Android
npm run android

# iOS
cd ios && bundle exec pod install && cd ..
npm run ios
```

### Environment

Copy `.env.example` to `.env` and configure:

```bash
APP_NAME=Shadow Wallet
APP_SCHEME=shadowwallet
FRONTEND_URL=https://example.com
TRUST_LIST_API_URL=https://example.com/api/trust
SUPPORT_EMAIL=support@example.com
```

## Roadmap

- [x] Project skeleton + navigation
- [x] OID4VCI / OID4VP protocol implementation
- [x] SD-JWT selective disclosure
- [x] DID:key generation
- [x] VC verification (online + offline)
- [x] Auth screens (wallet creation, PIN, login)
- [x] Main app screens (home, credential, presentation, settings)
- [x] i18n (zh-TW + en)
- [ ] Native KeyManager module (Android KeyStore + iOS Secure Enclave)
- [ ] SQLite + SQLCipher integration
- [ ] QR code scanning (react-native-vision-camera)
- [ ] Biometric authentication
- [ ] NFC VP transmission
- [ ] Trust list API integration
- [ ] E2E testing

## Acknowledgements

This project is inspired by and references the open-source [TWDIW official app](https://github.com/moda-gov-tw/TWDIW-official-app) released under MIT License by Taiwan's Ministry of Digital Affairs (數位發展部). The protocol implementations (OID4VCI, OID4VP, SD-JWT, DID) are ported from the original Dart/Flutter SDK.

## License

[MIT](LICENSE)
