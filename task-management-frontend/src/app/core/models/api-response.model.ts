export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}