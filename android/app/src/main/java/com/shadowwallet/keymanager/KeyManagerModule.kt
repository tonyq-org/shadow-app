package com.shadowwallet.keymanager

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature
import java.security.interfaces.ECPublicKey
import java.security.spec.ECPoint
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import org.json.JSONObject

class KeyManagerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "KeyManagerModule"
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val SIG_ALGO = "SHA256withECDSA"
  }

  override fun getName() = NAME

  private fun keyStore(): KeyStore {
    val ks = KeyStore.getInstance(ANDROID_KEYSTORE)
    ks.load(null)
    return ks
  }

  private fun base64UrlNoPad(bytes: ByteArray): String =
      android.util.Base64.encodeToString(
          bytes,
          android.util.Base64.URL_SAFE or android.util.Base64.NO_PADDING or android.util.Base64.NO_WRAP)

  private fun intToBytesBE32(v: BigInteger): ByteArray {
    val bytes = v.toByteArray()
    if (bytes.size == 32) return bytes
    if (bytes.size == 33 && bytes[0] == 0.toByte()) return bytes.copyOfRange(1, 33)
    val out = ByteArray(32)
    System.arraycopy(bytes, 0, out, 32 - bytes.size, bytes.size)
    return out
  }

  private fun publicKeyToJwk(publicKey: ECPublicKey): String {
    val point: ECPoint = publicKey.w
    val x = base64UrlNoPad(intToBytesBE32(point.affineX))
    val y = base64UrlNoPad(intToBytesBE32(point.affineY))
    val jwk = JSONObject()
    jwk.put("kty", "EC")
    jwk.put("crv", "P-256")
    jwk.put("x", x)
    jwk.put("y", y)
    return jwk.toString()
  }

  @ReactMethod
  fun generateP256Key(keyTag: String, promise: Promise) {
    try {
      val ks = keyStore()
      if (ks.containsAlias(keyTag)) {
        ks.deleteEntry(keyTag)
      }
      val spec =
          KeyGenParameterSpec.Builder(keyTag, KeyProperties.PURPOSE_SIGN)
              .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1"))
              .setDigests(KeyProperties.DIGEST_SHA256)
              .build()
      val kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, ANDROID_KEYSTORE)
      kpg.initialize(spec)
      val kp = kpg.generateKeyPair()
      val jwk = publicKeyToJwk(kp.public as ECPublicKey)
      promise.resolve(jwk)
    } catch (e: Exception) {
      promise.reject("KEY_GEN_ERROR", e)
    }
  }

  private fun derToJose(der: ByteArray): ByteArray {
    var idx = 0
    if (der[idx++] != 0x30.toByte()) throw IllegalArgumentException("Invalid DER")
    var len = der[idx++].toInt() and 0xff
    if (len and 0x80 != 0) {
      val n = len and 0x7f
      len = 0
      repeat(n) { len = (len shl 8) or (der[idx++].toInt() and 0xff) }
    }
    if (der[idx++] != 0x02.toByte()) throw IllegalArgumentException("Invalid R")
    val rLen = der[idx++].toInt() and 0xff
    val r = der.copyOfRange(idx, idx + rLen)
    idx += rLen
    if (der[idx++] != 0x02.toByte()) throw IllegalArgumentException("Invalid S")
    val sLen = der[idx++].toInt() and 0xff
    val s = der.copyOfRange(idx, idx + sLen)
    val rFixed = trimLeadingZeroes(r, 32)
    val sFixed = trimLeadingZeroes(s, 32)
    return rFixed + sFixed
  }

  private fun trimLeadingZeroes(bytes: ByteArray, size: Int): ByteArray {
    var src = bytes
    while (src.isNotEmpty() && src[0] == 0.toByte() && src.size > size) {
      src = src.copyOfRange(1, src.size)
    }
    if (src.size == size) return src
    val out = ByteArray(size)
    System.arraycopy(src, 0, out, size - src.size, src.size)
    return out
  }

  @ReactMethod
  fun sign(keyTag: String, header: String, payload: String, promise: Promise) {
    try {
      val ks = keyStore()
      val privateKey = ks.getKey(keyTag, null) as? PrivateKey
          ?: throw IllegalStateException("Key not found: $keyTag")

      val headerB64 = base64UrlNoPad(header.toByteArray(Charsets.UTF_8))
      val payloadB64 = base64UrlNoPad(payload.toByteArray(Charsets.UTF_8))
      val signingInput = "$headerB64.$payloadB64"

      val signer = Signature.getInstance(SIG_ALGO)
      signer.initSign(privateKey)
      signer.update(signingInput.toByteArray(Charsets.UTF_8))
      val derSig = signer.sign()
      val joseSig = derToJose(derSig)
      val sigB64 = base64UrlNoPad(joseSig)

      promise.resolve("$signingInput.$sigB64")
    } catch (e: Exception) {
      promise.reject("SIGN_ERROR", e)
    }
  }

  @ReactMethod
  fun deleteKey(keyTag: String, promise: Promise) {
    try {
      val ks = keyStore()
      if (ks.containsAlias(keyTag)) {
        ks.deleteEntry(keyTag)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("DELETE_ERROR", e)
    }
  }

  @ReactMethod
  fun pbkdf2(
      password: String,
      saltHex: String,
      iterations: Int,
      keyLenBytes: Int,
      promise: Promise
  ) {
    try {
      val salt = ByteArray(saltHex.length / 2)
      for (i in salt.indices) {
        salt[i] = ((Character.digit(saltHex[i * 2], 16) shl 4) +
            Character.digit(saltHex[i * 2 + 1], 16)).toByte()
      }
      val spec = PBEKeySpec(password.toCharArray(), salt, iterations, keyLenBytes * 8)
      val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
      val derived = factory.generateSecret(spec).encoded
      val sb = StringBuilder(derived.size * 2)
      for (b in derived) sb.append(String.format("%02x", b.toInt() and 0xff))
      promise.resolve(sb.toString())
    } catch (e: Exception) {
      promise.reject("PBKDF2_ERROR", e)
    }
  }

  @ReactMethod
  fun verifyUser(keyTag: String, publicKey: String, promise: Promise) {
    try {
      val ks = keyStore()
      val entry = ks.getCertificate(keyTag) ?: return promise.resolve(false)
      val ecKey = entry.publicKey as? ECPublicKey ?: return promise.resolve(false)
      val jwk = publicKeyToJwk(ecKey)
      val storedJson = JSONObject(jwk)
      val providedJson = JSONObject(publicKey)
      val match = storedJson.getString("x") == providedJson.getString("x") &&
          storedJson.getString("y") == providedJson.getString("y")
      promise.resolve(match)
    } catch (e: Exception) {
      promise.reject("VERIFY_ERROR", e)
    }
  }
}
