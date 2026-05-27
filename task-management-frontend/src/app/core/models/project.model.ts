import { User } from './user.model';

export enum ProjectStatus {
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

export interface Project {
    _id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    owner: User;
    members: User[];
    createdAt: string;
    updatedAt: string;
}