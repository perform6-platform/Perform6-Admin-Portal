export type UserRole = 'PLATFORM_ADMIN' | 'CONTENT_MANAGER' | string;
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}
