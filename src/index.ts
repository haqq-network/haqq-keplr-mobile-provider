import { InjectedKeplr, injectKeplrToWindow, ProxyRequest, ProxyRequestResponse } from "@keplr-wallet/provider";
import { Result } from "@keplr-wallet/router";
import pkg from '../package.json';
import { JsonRpcError, WrappedJsonRpcRequest, WrappedJsonRpcResponse } from "./json-rpc";

const PROVIDER_NAME = 'haqq-keplr-provider';
const VERSION = `${PROVIDER_NAME}:${pkg.version}`;
const UNKNOWN_ERROR = 'UNKNOWN_ERROR: RESULT IS UNDEFINED';

const listenersMap = new Map();

function getError(error: JsonRpcError | string | undefined): Result['error'] {
    if (typeof error === 'string') {
        if (error.length > 0) {
            return error;
        } else {
            return UNKNOWN_ERROR
        }
    }

    if (!error || (!error?.code && !error?.message)) {
        return UNKNOWN_ERROR;
    }

    let errorMsg = '';

    if(error.code) {
        errorMsg = `code: ${error.code};`;
    }

    if(error.message) {
        errorMsg = `${errorMsg}\nmessage: ${error.message};`;
    }

    if(error.stack) {
        errorMsg = `${errorMsg}\nstack: ${error.stack};`;
    }
    
    return errorMsg || UNKNOWN_ERROR;
}

const keplr = new InjectedKeplr(
    VERSION,
    'core',
    {
        addMessageListener: (fn) => {
            const listener = ({ data: eventData, ...event }: MessageEvent<string>) => {
                try {
                    const message: WrappedJsonRpcResponse = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;

                    if (message.name !== PROVIDER_NAME || !message?.data?.id) {
                        return;
                    }
                    const data = message.data;
                    const response: ProxyRequestResponse = {
                        type: 'proxy-request-response',
                        id: data.id,
                        result: (data.result ? {
                            return: data.result,
                        } : {
                            error: getError(data.error),
                        }) as Result,
                    }
                    if (window.__HAQQ_KEPLR_DEV__) {
                        console.log(`${PROVIDER_NAME}: recieve response`, { response, data });
                    }
                    fn.bind(window)({ ...event, data: response });
                } catch (error) {
                    console.error(`${PROVIDER_NAME}: addMessageListener`, { error, eventData });
                }
            }
            listenersMap.set(fn, listener);
            window.addEventListener('message', listener)
        },
        removeMessageListener: (fn) => {
            window.removeEventListener('message', listenersMap.get(fn));
            listenersMap.delete(fn);
        },
        postMessage: (message: ProxyRequest) => {
            try {
                const origin = window.location.origin;
                const request: WrappedJsonRpcRequest = {
                    origin,
                    name: PROVIDER_NAME,
                    data: {
                        jsonrpc: '2.0',
                        id: message.id,
                        method: message.method,
                        params: message.args,
                    },
                }
                if (window.__HAQQ_KEPLR_DEV__) {
                    console.log(`${PROVIDER_NAME}: send request`, { request, message });
                }
                window.ReactNativeWebView.postMessage(JSON.stringify(request));
            } catch (error) {
                console.error(`${PROVIDER_NAME}: postMessage`, { error, message });
            }
        },
    }
)

injectKeplrToWindow(keplr);