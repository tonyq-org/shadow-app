# Shadow Wallet - Claude Operating Notes

## iOS 啟動時待辦（驗證後可移除本段）

在 Mac 上首次 build iOS 前，必須把以下檔案加入 Xcode 專案的 `ShadowWallet` target membership（Windows 無法編輯 `.xcodeproj`，所以這些檔案目前只存在於檔案系統，尚未掛到 target）：

- `ios/ShadowWallet/KeyManagerModule.swift`
- `ios/ShadowWallet/KeyManagerModule.m`

### 加入步驟
1. Xcode 開啟 `ios/ShadowWallet.xcworkspace`
2. 在左側 Project Navigator 找到兩個檔案（若沒出現則 File → Add Files to "ShadowWallet"…）
3. 選取檔案 → 右側 File Inspector → Target Membership 勾選 `ShadowWallet`
4. 檢查 Build Phases → Compile Sources 裡有 `.swift` 與 `.m`
5. 若為 Swift 首次加入：Xcode 會詢問是否建立 Bridging Header，選 Create（或確認 `ShadowWallet-Bridging-Header.h` 已包含 `#import <React/RCTBridgeModule.h>`）

### 驗證方式
- `pod install` → `npx react-native run-ios`
- App 啟動時確認沒有 `KeyManagerModule native module is not linked` 例外
- 建立錢包 / 登入輸入 PIN 時 loading overlay 幾乎不可見（< 200ms），代表走到 native PBKDF2（`CCKeyDerivationPBKDF`），而不是 JS fallback

驗證通過後，請刪除本段。
