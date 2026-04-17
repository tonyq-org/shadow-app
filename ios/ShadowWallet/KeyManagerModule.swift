import Foundation
import Security
import CommonCrypto
import React

@objc(KeyManagerModule)
class KeyManagerModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }

  private func keyTagData(_ tag: String) -> Data {
    return tag.data(using: .utf8)!
  }

  private func loadPrivateKey(tag: String) -> SecKey? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData(tag),
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecReturnRef as String: true
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess else { return nil }
    return (item as! SecKey)
  }

  private func deleteKeyInternal(tag: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData(tag),
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom
    ]
    SecItemDelete(query as CFDictionary)
  }

  private func base64UrlNoPad(_ data: Data) -> String {
    return data.base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }

  private func publicKeyJwk(_ pubKey: SecKey) throws -> String {
    var error: Unmanaged<CFError>?
    guard let raw = SecKeyCopyExternalRepresentation(pubKey, &error) as Data? else {
      throw NSError(domain: "KeyManager", code: -1,
                    userInfo: [NSLocalizedDescriptionKey: "Failed to export public key"])
    }
    // raw = 0x04 || X (32) || Y (32)
    guard raw.count == 65, raw[0] == 0x04 else {
      throw NSError(domain: "KeyManager", code: -2,
                    userInfo: [NSLocalizedDescriptionKey: "Unexpected public key format"])
    }
    let x = raw.subdata(in: 1..<33)
    let y = raw.subdata(in: 33..<65)
    let jwk: [String: Any] = [
      "kty": "EC",
      "crv": "P-256",
      "x": base64UrlNoPad(x),
      "y": base64UrlNoPad(y)
    ]
    let data = try JSONSerialization.data(withJSONObject: jwk, options: [.sortedKeys])
    return String(data: data, encoding: .utf8) ?? "{}"
  }

  @objc(generateP256Key:withResolver:withRejecter:)
  func generateP256Key(_ keyTag: String,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    deleteKeyInternal(tag: keyTag)

    var accessError: Unmanaged<CFError>?
    guard let access = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault,
      kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      [.privateKeyUsage],
      &accessError
    ) else {
      let err = accessError?.takeRetainedValue()
      reject("ACCESS_ERROR", err?.localizedDescription ?? "access control failed", err as Error?)
      return
    }

    let useSecureEnclave = SecureEnclave.isAvailable
    var privateKeyAttrs: [String: Any] = [
      kSecAttrIsPermanent as String: true,
      kSecAttrApplicationTag as String: keyTagData(keyTag),
      kSecAttrAccessControl as String: access
    ]
    var attrs: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrKeySizeInBits as String: 256,
      kSecPrivateKeyAttrs as String: privateKeyAttrs
    ]
    if useSecureEnclave {
      attrs[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
    }

    var createError: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(attrs as CFDictionary, &createError) else {
      let err = createError?.takeRetainedValue()
      reject("KEY_GEN_ERROR", err?.localizedDescription ?? "key generation failed", err as Error?)
      return
    }
    guard let pubKey = SecKeyCopyPublicKey(privateKey) else {
      reject("KEY_GEN_ERROR", "public key extract failed", nil)
      return
    }
    do {
      let jwk = try publicKeyJwk(pubKey)
      resolve(jwk)
    } catch {
      reject("KEY_GEN_ERROR", error.localizedDescription, error)
    }
  }

  private func derToJose(_ der: Data) throws -> Data {
    var idx = 0
    let bytes = [UInt8](der)
    guard bytes[idx] == 0x30 else { throw NSError(domain: "Sig", code: 1) }
    idx += 1
    var len = Int(bytes[idx]); idx += 1
    if len & 0x80 != 0 {
      let n = len & 0x7f
      len = 0
      for _ in 0..<n { len = (len << 8) | Int(bytes[idx]); idx += 1 }
    }
    guard bytes[idx] == 0x02 else { throw NSError(domain: "Sig", code: 2) }
    idx += 1
    let rLen = Int(bytes[idx]); idx += 1
    let r = Array(bytes[idx..<idx + rLen]); idx += rLen
    guard bytes[idx] == 0x02 else { throw NSError(domain: "Sig", code: 3) }
    idx += 1
    let sLen = Int(bytes[idx]); idx += 1
    let s = Array(bytes[idx..<idx + sLen])

    func fix(_ b: [UInt8], _ size: Int) -> [UInt8] {
      var v = b
      while v.count > size && v.first == 0 { v.removeFirst() }
      if v.count < size { v = Array(repeating: 0, count: size - v.count) + v }
      return v
    }
    return Data(fix(r, 32) + fix(s, 32))
  }

  @objc(sign:withHeader:withPayload:withResolver:withRejecter:)
  func sign(_ keyTag: String,
            header: String,
            payload: String,
            resolve: @escaping RCTPromiseResolveBlock,
            reject: @escaping RCTPromiseRejectBlock) {
    guard let privateKey = loadPrivateKey(tag: keyTag) else {
      reject("SIGN_ERROR", "key not found: \(keyTag)", nil)
      return
    }
    let headerB64 = base64UrlNoPad(Data(header.utf8))
    let payloadB64 = base64UrlNoPad(Data(payload.utf8))
    let signingInput = "\(headerB64).\(payloadB64)"
    let inputData = Data(signingInput.utf8)

    var signError: Unmanaged<CFError>?
    guard let derSig = SecKeyCreateSignature(
      privateKey,
      .ecdsaSignatureMessageX962SHA256,
      inputData as CFData,
      &signError
    ) as Data? else {
      let err = signError?.takeRetainedValue()
      reject("SIGN_ERROR", err?.localizedDescription ?? "sign failed", err as Error?)
      return
    }
    do {
      let jose = try derToJose(derSig)
      resolve("\(signingInput).\(base64UrlNoPad(jose))")
    } catch {
      reject("SIGN_ERROR", "signature conversion failed", error)
    }
  }

  @objc(deleteKey:withResolver:withRejecter:)
  func deleteKey(_ keyTag: String,
                 resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    deleteKeyInternal(tag: keyTag)
    resolve(true)
  }

  @objc(pbkdf2:withSaltHex:withIterations:withKeyLenBytes:withResolver:withRejecter:)
  func pbkdf2(_ password: String,
              saltHex: String,
              iterations: NSInteger,
              keyLenBytes: NSInteger,
              resolve: @escaping RCTPromiseResolveBlock,
              reject: @escaping RCTPromiseRejectBlock) {
    var salt = Data(capacity: saltHex.count / 2)
    var i = saltHex.startIndex
    while i < saltHex.endIndex {
      let next = saltHex.index(i, offsetBy: 2)
      guard next <= saltHex.endIndex,
            let byte = UInt8(saltHex[i..<next], radix: 16) else {
        reject("PBKDF2_ERROR", "invalid salt hex", nil)
        return
      }
      salt.append(byte)
      i = next
    }
    let passwordBytes = Array(password.utf8).map { Int8(bitPattern: $0) }
    var derived = [UInt8](repeating: 0, count: keyLenBytes)
    let status = salt.withUnsafeBytes { saltPtr -> Int32 in
      guard let saltBase = saltPtr.bindMemory(to: UInt8.self).baseAddress else {
        return Int32(kCCParamError)
      }
      return CCKeyDerivationPBKDF(
        CCPBKDFAlgorithm(kCCPBKDF2),
        passwordBytes, passwordBytes.count,
        saltBase, salt.count,
        CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
        UInt32(iterations),
        &derived, keyLenBytes
      )
    }
    guard status == kCCSuccess else {
      reject("PBKDF2_ERROR", "CCKeyDerivationPBKDF failed: \(status)", nil)
      return
    }
    let hex = derived.map { String(format: "%02x", $0) }.joined()
    resolve(hex)
  }

  @objc(verifyUser:withPublicKey:withResolver:withRejecter:)
  func verifyUser(_ keyTag: String,
                  publicKey: String,
                  resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {
    guard let privateKey = loadPrivateKey(tag: keyTag),
          let pubKey = SecKeyCopyPublicKey(privateKey) else {
      resolve(false)
      return
    }
    do {
      let storedJwk = try publicKeyJwk(pubKey)
      guard let storedData = storedJwk.data(using: .utf8),
            let providedData = publicKey.data(using: .utf8),
            let stored = try JSONSerialization.jsonObject(with: storedData) as? [String: Any],
            let provided = try JSONSerialization.jsonObject(with: providedData) as? [String: Any] else {
        resolve(false)
        return
      }
      let match = (stored["x"] as? String) == (provided["x"] as? String) &&
                  (stored["y"] as? String) == (provided["y"] as? String)
      resolve(match)
    } catch {
      reject("VERIFY_ERROR", error.localizedDescription, error)
    }
  }
}

fileprivate enum SecureEnclave {
  static var isAvailable: Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    return true
    #endif
  }
}
