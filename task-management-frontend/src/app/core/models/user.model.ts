export enum UserRole {
    ADMIN = 'admin',
    MEMBER = 'member',
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse{
    user: User;
    accessToken: string;
}

export interface UpdateProfilePayload {
    name?: string;
    email?: string;
    password?: string;
}

export type AuthData = AuthResponse;