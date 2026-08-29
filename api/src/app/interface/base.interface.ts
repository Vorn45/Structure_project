export interface BaseResponse<T = any> {
    status_code: number;
    success: number;
    message: any;
    data?: T;
}

export interface ErrorBaseResponse<T = any> {
    status_code: number;
    success: number;
    message: any;
    data?: T;
    error?: any;
    path: string;
    timestamp: string;
}

export interface ListResponse<T = any> {
    limit: number;
    offset: number;
    total: number;
    meta?: any | undefined;
    results: T[];
}

export interface StreamResponse<T = any> {
    stream_end: number;
    progress: number;
    results: T;
}
