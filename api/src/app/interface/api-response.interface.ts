export interface ApiSuccessResponse<TData> {
    response_code: number;
    response_msg: string | { name_en: string; name_kh: string };
    data: TData;
}

export interface ApiSuccessWithPaginationResponse<
    TData,
> extends ApiSuccessResponse<TData> {
    pagination: {
        total: number;
        limit: number;
        offset: number;
    };
}
