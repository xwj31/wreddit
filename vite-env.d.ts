/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Declare virtual modules for PWA
declare module "virtual:pwa-register" {
  export function registerSW(options?: {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: []) => void;
  }): (reloadPage?: boolean) => Promise<void>;
}
