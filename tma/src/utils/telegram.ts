import type {
    WebAppUser,
    WebAppChat,
    WebAppInitData,
    ThemeParams,
    HapticFeedback,
    CloudStorage,
    BackButton,
    MainButton,
    SecondaryButton,
    SettingsButton,
    BiometricManager,
    EventNames,
    EventParams,
    PopupParams,
    Platforms,
    ShareStoryParams
  } from "@twa-dev/types";
  
  export type {
    WebAppUser,
    WebAppChat,
    WebAppInitData,
    ThemeParams,
    PopupParams
  };
  
  export interface WebApp {
    initData: string;
    initDataUnsafe: WebAppInitData;
    version: string;
    platform: Platforms;
    colorScheme: "light" | "dark";
    themeParams: ThemeParams;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    isClosingConfirmationEnabled: boolean;
    isVerticalSwipesEnabled: boolean;
    headerColor: string;
    backgroundColor: string;
    bottomBarColor: string;
    isFullscreen: boolean;
    isOrientationLocked: boolean;
    isActive: boolean;
    safeAreaInset: { top: number; bottom: number; left: number; right: number };
    contentSafeAreaInset: { top: number; bottom: number; left: number; right: number };
  
    // Buttons
    BackButton: BackButton;
    MainButton: MainButton;
    SecondaryButton: SecondaryButton;
    SettingsButton: SettingsButton;
  
    // Features
    HapticFeedback: HapticFeedback;
    CloudStorage: CloudStorage;
    BiometricManager: BiometricManager;
  
    // Methods
    onEvent: <T extends EventNames>(
      eventName: T,
      callback: (params: EventParams[T]) => unknown
    ) => void;
    offEvent: <T extends EventNames>(
      eventName: T,
      callback: (params: EventParams[T]) => unknown
    ) => void;
    
    sendData: (data: unknown) => void;
    ready: () => void;
    expand: () => void;
    close: (params?: { return_back?: boolean }) => void;
  
    // Navigation & Links
    openLink: (url: string, options?: { 
      try_instant_view?: boolean;
      try_browser?: boolean;
    }) => void;
    openTelegramLink: (url: string, options?: { force_request?: boolean }) => void;
    openInvoice: (url: string, callback?: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  
    // UI Methods
    setHeaderColor: (color: "bg_color" | "secondary_bg_color" | `#${string}`) => void;
    setBackgroundColor: (color: "bg_color" | "secondary_bg_color" | `#${string}`) => void;
    setBottomBarColor: (color: "bg_color" | "secondary_bg_color" | "bottom_bar_bg_color" | `#${string}`) => void;
    
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    enableVerticalSwipes: () => void;
    disableVerticalSwipes: () => void;
    
    requestFullscreen: () => void;
    exitFullscreen: () => void;
    toggleOrientationLock: (locked: boolean) => void;
  
    // Popups & Alerts
    showPopup: (params: PopupParams, callback?: (button_id?: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    showScanQrPopup: (params: { text?: string }, callback?: (text: string) => boolean | void) => void;
    closeScanQrPopup: () => void;
  
    // Permissions & Access
    requestWriteAccess: (callback?: (access: boolean) => void) => void;
    requestContact: (callback?: (shared: boolean) => void) => void;
    requestEmojiStatusAccess: (callback?: (access: boolean) => void) => void;
  
    // Sharing & Content
    shareToStory: (mediaUrl: string, params?: ShareStoryParams) => void;
    shareMessage: (msg_id: string, callback?: (shared: boolean) => void) => void;
    setEmojiStatus: (
      custom_emoji_id: string, 
      params?: { duration?: number }, 
      callback?: (success: boolean) => void
    ) => void;
    
    // Clipboard
    readTextFromClipboard: (callback?: (text: string) => void) => void;
  
    // Home Screen
    addToHomeScreen: () => void;
    checkHomeScreenStatus: (callback?: (status: "added" | "not_added" | "unknown") => void) => void;
  
    // Misc
    isVersionAtLeast: (version: string) => boolean;
    switchInlineQuery: (
      query: string,
      choose_chat_types?: Array<"users" | "bots" | "groups" | "channels">
    ) => void;
    invokeCustomMethod: <T = unknown>(
      method: string,
      params?: Record<string, unknown>,
      callback?: (err: string | null, result?: T) => void
    ) => void;
  }
  
  declare global {
    interface Window {
      Telegram: {
        WebApp: WebApp;
      }
    }
  }
  
export function getWebApp(): WebApp {
  return window.Telegram.WebApp;
}
