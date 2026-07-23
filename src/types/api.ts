export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SuccessFlag {
  success: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface IdSelectOption extends SelectOption {
  id: string;
}

export interface ApiErrorBody {
  success?: boolean;
  statusCode?: number;
  errorCode?: string;
  message?: string | string[];
  error?: string;
  details?: {
    field?: string;
    fields?: Record<string, string>;
  };
}
