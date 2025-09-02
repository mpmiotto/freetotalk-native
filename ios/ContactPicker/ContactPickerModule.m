#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ContactPickerModule, NSObject)

RCT_EXTERN_METHOD(showContactPicker:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// This ensures the module is initialized on the main thread
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end