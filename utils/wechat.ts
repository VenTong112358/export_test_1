import { Platform } from 'react-native';
import { LegacyEventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

type ExpoNativeWechatModule = {
  registerApp: (req: { appid: string; universalLink?: string; log?: boolean; logPrefix?: string }) => Promise<boolean> | undefined;
  isWechatInstalled: () => Promise<boolean>;
  sendAuthRequest: (req?: { scope: string; state?: string }) => Promise<{ data: { code: string } }>;
};

type ExpoNativeWechatNativeModule = {
  registerApp: (params: { id: string; appid: string; universalLink?: string; log?: boolean; logPrefix?: string }) => void;
  isWechatInstalled: (params: { id: string }) => void;
  sendAuthRequest: (params: { id: string; scope: string; state?: string }) => void;
};

type ResponseDataEvent = {
  id?: string;
  success?: boolean;
  errorCode?: number;
  errorStr?: string | null;
  message?: string;
};

type ResponseFromNotificationEvent = {
  type?: string;
  errorCode?: number;
  errorStr?: string | null;
  data?: any;
};

function getExpoNativeWechatModule(): ExpoNativeWechatModule | null {
  if (Platform.OS === 'web') return null;
  // Avoid importing expo-native-wechat in Expo Go (native module missing) because the package
  // calls requireNativeModule('ExpoNativeWechat') at import-time and would crash the app.
  const native = requireOptionalNativeModule('ExpoNativeWechat');
  if (!native) return null;
  try {
    // Dynamic require so the app can still run in Expo Go (where the native module won't exist).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-native-wechat') as ExpoNativeWechatModule;
  } catch (_e) {
    return null;
  }
}

function getExpoNativeWechatNativeModule(): ExpoNativeWechatNativeModule | null {
  if (Platform.OS === 'web') return null;
  return requireOptionalNativeModule('ExpoNativeWechat') as ExpoNativeWechatNativeModule | null;
}

function nativeModuleMissingError() {
  return new Error(
    "Cannot find native module 'ExpoNativeWechat'. You are probably running in Expo Go. " +
      'Please use a Development Build (expo run:android/ios) or an EAS dev client build to use WeChat login.'
  );
}

function randomId() {
  return (Math.random() + 1).toString(36).substring(2);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

let lastRegisterReq: { appid: string; universalLink?: string } | null = null;
let isRegistered = false;
let registering: Promise<boolean> | null = null;

async function ensureWechatRegistered(req?: { appid: string; universalLink?: string }) {
  const native = getExpoNativeWechatNativeModule();
  if (!native) throw nativeModuleMissingError();

  const registerReq = req ?? lastRegisterReq;
  if (!registerReq?.appid) {
    throw new Error('WeChat SDK not registered: missing appid. Call safeRegisterWechatApp(...) first.');
  }

  if (isRegistered) return true;
  if (registering) return await registering;

  registering = (async () => {
    console.log('[wechat] registerApp start');
    const emitter = new LegacyEventEmitter(native as any);
    const requestId = randomId();

    const promise = new Promise<boolean>((resolve, reject) => {
      const sub = emitter.addListener('ResponseData', (evt: ResponseDataEvent) => {
        if (evt?.id !== requestId) return;
        sub.remove();
        resolve(evt?.success === true);
      });
      try {
        native.registerApp({ id: requestId, appid: registerReq.appid, universalLink: registerReq.universalLink });
      } catch (e) {
        sub.remove();
        reject(e);
      }
    });

    const ok = await withTimeout(promise, 6000, 'WeChat registerApp');
    console.log('[wechat] registerApp done:', ok);
    isRegistered = ok;
    lastRegisterReq = registerReq;
    return ok;
  })();

  try {
    return await registering;
  } finally {
    registering = null;
  }
}

export async function safeRegisterWechatApp(req: { appid: string; universalLink?: string }) {
  try {
    lastRegisterReq = req;
    const ok = await ensureWechatRegistered(req);
    return ok;
  } catch (e) {
    // If registration fails, don't hard-crash the whole app.
    console.warn('[wechat] registerApp failed:', e);
    return false;
  }
}

export async function safeIsWechatInstalled(): Promise<boolean> {
  const native = getExpoNativeWechatNativeModule();
  if (!native) throw nativeModuleMissingError();

  // Ensure wxApi exists in the module (it's set in registerApp)
  await ensureWechatRegistered();

  const emitter = new LegacyEventEmitter(native as any);
  const requestId = randomId();

  const promise = new Promise<ResponseDataEvent>((resolve, reject) => {
    const sub = emitter.addListener('ResponseData', (evt: ResponseDataEvent) => {
      if (evt?.id !== requestId) return;
      sub.remove();
      resolve(evt);
    });
    try {
      native.isWechatInstalled({ id: requestId });
    } catch (e) {
      sub.remove();
      reject(e);
    }
  });

  const evt = await withTimeout(promise, 4000, 'WeChat isWechatInstalled');
  return evt?.success === true;
}

export async function safeSendWechatAuthRequest(req: { scope: string; state?: string }) {
  // Use the native module directly so we can:
  // - detect "sendReq" failure (success=false) and avoid hanging forever
  // - add a timeout for the callback
  const native = getExpoNativeWechatNativeModule();
  if (!native) throw nativeModuleMissingError();

  // Critical: registerApp installs the BroadcastReceiver used to forward WXEntryActivity intents.
  // Without it, WeChat returns to the app but JS never receives SendAuthResp -> endless loading.
  const registeredOk = await ensureWechatRegistered();
  if (!registeredOk) {
    throw new Error('WeChat SDK registerApp failed. Please check appid/config/signature.');
  }

  const emitter = new LegacyEventEmitter(native as any);
  const requestId = randomId();
  console.log('[wechat] sendAuthRequest start', { requestId, scope: req.scope });

  const ackPromise = new Promise<ResponseDataEvent>((resolve, reject) => {
    const sub = emitter.addListener('ResponseData', (evt: ResponseDataEvent) => {
      if (evt?.id !== requestId) return;
      sub.remove();
      resolve(evt);
    });
    try {
      native.sendAuthRequest({ id: requestId, scope: req.scope, state: req.state });
    } catch (e) {
      sub.remove();
      reject(e);
    }
  });

  const ack = await withTimeout(ackPromise, 4000, 'WeChat sendAuthRequest ack');
  console.log('[wechat] sendAuthRequest ack:', ack);
  if (ack?.success !== true) {
    throw new Error(
      `WeChat auth request failed to send (success=${String(ack?.success)}). ` +
        `This usually means WeChat SDK rejected the request (appid/signature mismatch or misconfig).`
    );
  }

  console.log('[wechat] waiting for SendAuthResp...');
  const respPromise = new Promise<{ data: { code: string } }>((resolve, reject) => {
    const sub = emitter.addListener('ResponseFromNotification', (evt: ResponseFromNotificationEvent) => {
      // Debug: log *all* notification responses while waiting for auth
      console.log('[wechat] ResponseFromNotification:', {
        type: evt?.type,
        errorCode: evt?.errorCode,
        errorStr: evt?.errorStr,
        hasData: !!evt?.data,
      });
      if (evt?.type !== 'SendAuthResp') return;
      sub.remove();
      if (evt?.errorCode && evt.errorCode !== 0) {
        return reject(new Error(`[Native Wechat]: (${evt.errorCode}) ${evt.errorStr || 'Unknown error'}`));
      }
      const code = evt?.data?.code;
      if (!code) return reject(new Error('WeChat auth did not return a code'));
      resolve({ data: { code } });
    });
  });

  return await withTimeout(respPromise, 30000, 'WeChat SendAuthResp');
}

