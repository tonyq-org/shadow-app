#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KeyManagerModule, NSObject)

RCT_EXTERN_METHOD(generateP256Key:(NSString *)keyTag
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(sign:(NSString *)keyTag
                  withHeader:(NSString *)header
                  withPayload:(NSString *)payload
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteKey:(NSString *)keyTag
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(pbkdf2:(NSString *)password
                  withSaltHex:(NSString *)saltHex
                  withIterations:(NSInteger)iterations
                  withKeyLenBytes:(NSInteger)keyLenBytes
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifyUser:(NSString *)keyTag
                  withPublicKey:(NSString *)publicKey
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
