export declare type JsonRpcVersion = '2.0';
export declare interface JsonRpcRequest {
    jsonrpc: JsonRpcVersion;
    method: string;
    id: string;
    params?: any;
}
export declare interface JsonRpcResponse {
    jsonrpc: JsonRpcVersion;
    id: string;
    result?: any;
    error?: JsonRpcError | string;
}
export declare interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
    stack?: string;
}
export type RNBridgeMessage<T> = {
    data: T;
    origin: string;
    name: string;
}
export declare type WrappedJsonRpcRequest = RNBridgeMessage<JsonRpcRequest>;
export declare type WrappedJsonRpcResponse = RNBridgeMessage<JsonRpcResponse>;