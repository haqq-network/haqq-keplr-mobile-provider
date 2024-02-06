# haqq-keplr-mobile-provider

Keplr provider for injecting to react-native WebView component

# How to inject keprl provider script to react-native WebView extension

1. Build script

```bash
yarn & yarn build
```

1. Copy file to native apps assets:
 > android/app/src/main/assets/custom/keplr-mobile-provider.js
 > for iOS import file from xcode to create link

1. Load script function

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

4. Inject to WebView component

```tsx
import {Platform} from 'react-native';
import WebView from 'react-native-webview';

function Web3KeplrWebView() {
  const [keplrProviderScript, setKeplrProviderScript] = useState('');

  const injectedJSBeforeContentLoaded = useMemo(
    () =>
      `
     function init() {
        if(window?.keplr?.isHaqqWallet){
          return;
        }
        ${keplrProviderScript}
        console.log('keplr loaded:', !!window.keplr);
        if(window.keprl) {
          window.keplr.isHaqqWallet = true;
        }
      };
      ${
        Platform.OS === 'iOS'
          ? 'init();'
          : 'document.addEventListener("DOMContentLoaded", init);'
      }
      true;`,
    [keplrProviderScript],
  );

  useEffect(() => {
    loadScript('keplr-mobile-provider.js').then(script => {
      setKeplrProviderScript(script);
    });
  }, []);


  if (!keplrProviderScript) {
    return null;
  }

  return  (
        <WebView
            injectedJavaScriptBeforeContentLoaded={injectedJSBeforeContentLoaded}
        />
    )
}
```