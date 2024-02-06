import { InjectedKeplr, injectKeplrToWindow } from "@keplr-wallet/provider";
import pkg from '../package.json';

const VERSION = `haqq-wallet-provider:${pkg.version}`;

const keplr = new InjectedKeplr(
    VERSION,
    'core',
    {
        addMessageListener: (fn) => {
            window.addEventListener('message', fn)
        },
        removeMessageListener: (fn) => {
            window.removeEventListener('message', fn);
        },
        postMessage: (message) => {
            const origin = window.location.origin;

            window.ReactNativeWebView.postMessage(JSON.stringify({
                origin,
                data: message,
                name: 'keplr'
            }));
        },
    }
)

injectKeplrToWindow(keplr);