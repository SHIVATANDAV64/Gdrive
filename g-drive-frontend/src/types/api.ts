 

 
export interface ApiResponse<T = unknown> {
     
    success: boolean;
     
    data?: T;
     
    error?: ApiError;
}

 
export interface ApiError {
     
    code: string;
     
    message: string;
}

 
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    offset: number;
    limit: number;
}

 
export interface OperationResult {
    success: boolean;
    message?: string;
}
