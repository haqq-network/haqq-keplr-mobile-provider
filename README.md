# Haqq-Keplr Mobile Provider

Keplr provider for injecting into React Native WebView component.

## How to Inject Keplr Provider Script into React Native WebView Extension

1. **Build the Script**

   Clone the repository and build the project:

   ```bash
   git clone https://github.com/haqq-network/haqq-keplr-mobile-provider.git
   cd haqq-keplr-mobile-provider && yarn && yarn build
    ```

2. **Copy the Bundle File to Native App Assets**

    For Android, copy the bundle file from `dist/keplr-mobile-provider.js` to the native app assets `android/app/src/main/assets/custom/keplr-mobile-provider.js`
    
    For iOS, import the file from Xcode to create a link.

1. **Load the Script Function**

    Use the following TypeScript code to load the script file:

    ```ts
    import RNFS from 'react-native-fs';
    import {Platform} from 'react-native';

    async function loadScriptFile(filename: string): Promise<string> {
        if (Platform.OS === 'android') {
          // When use the `await` operator, Android cannot find the file.
          // Error: ENOENT: $filename: open failed: ENOENT (No such file or directory), open 'undefined/$filename'
          return new Promise<string>((resolve, reject) => {
            RNFS.readFileAssets(`custom/${filename}`, 'utf8')
              .then(script => {
                resolve(script);
              })
              .catch(err => {
                reject(err);
              });
          });
        }

        const script = await RNFS.readFile(
          `${RNFS.MainBundlePath}/${filename}`,
          'utf8',
        );
        return script;
      },
    };
    ```
   
2. **Inject the Script into the WebView Component**

    Inject the Keplr provider script into the WebView component using the following React component:

    ```tsx
    import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
    import { Platform } from 'react-native';
    import WebView, { WebViewMessageEvent } from 'react-native-webview';

    const postMessageWebViewJS = (message: any, origin: string) => {
      return `
        (function () {
          try {
            window.postMessage(${JSON.stringify(message)}, '${origin}');
          } catch (err) {
            console.error('keplr provider response error:', err.message);
          }
        })()
      `;
    };

    function Web3KeplrWebView() {
      const [keplrProviderScript, setKeplrProviderScript] = useState('');
      const webviewRef = useRef<WebView>(null);

      const injectedJSBeforeContentLoaded = useMemo(() => `
        function init() {
          if (window?.keplr?.isHaqqWallet) {
            return;
          }
          ${keplrProviderScript}
          console.log('Keplr loaded:', !!window.keplr);
          if (window.keplr) {
            window.keplr.isHaqqWallet = true;
          }
        };
        ${
          Platform.OS === 'iOS'
            ? 'init();'
            : 'document.addEventListener("DOMContentLoaded", init);'
        }
        true;`, [keplrProviderScript]);

      const onMessage = useCallback(({ nativeEvent }: WebViewMessageEvent) => {
        if (!nativeEvent?.data || typeof nativeEvent.data !== 'string') {
          return;
        }

        const { name, origin, data } = JSON.parse(nativeEvent.data) ?? {};

        if (name !== 'keplr') {
          return;
        }

        console.log({ name, origin, data });

        const response = {
          id: data.id,
          type: 'proxy-request-response',
          result: {}
        };

        // Implement Keplr specific features
        // Reference: https://github.com/chainapsis/keplr-wallet/blob/master/docs/api/README.md#keplr-specific-features
        switch (data.method) {
          case 'getKey':
            response.result = {
              return: {
                name: 'Haqq Dev Test',
                algo: 'ethsecp256k1',
                pubKey: '__uint8array__0232c1a0e991adad7ba1c2faff4ade41506a499e34c89ea2aa2a384ac65aafbea2',
                address: '__uint8array__7ee0375a10acc7d0e3cdf1c21c9409be7a9dff7b',
                bech32Address: 'haqq10msrwkss4nrapc7d78ppe9qfheafmlmmrtgqvq',
                isNanoLedger: false,
                isKeystone: false,
              }
            };
            break;
          default:
            response.result.error = `${data.method} not implemented.`;
            break;
        }

        webviewRef.current?.injectJavaScript(postMessageWebViewJS(response, origin));
      }, [keplrProviderScript]);

      useEffect(() => {
        loadScriptFile('keplr-mobile-provider.js').then(script => {
          setKeplrProviderScript(script);
        });
      }, []);

      if (!keplrProviderScript) {
        return null;
      }

      return (
        <WebView
          ref={webviewRef}
          onMessage={onMessage}
          injectedJavaScriptBeforeContentLoaded={injectedJSBeforeContentLoaded}
        />
      );
    }
    ```