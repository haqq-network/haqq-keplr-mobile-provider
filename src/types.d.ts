declare interface ReactNativeWebView {
    postMessage: (message: string) => void;
};

declare interface Window {
    keplr: import('@keplr-wallet/provider').Keplr;
    ReactNativeWebView: ReactNativeWebView;
};