import { User } from './user.model';

export interface ActivityLog {
  _id: string;
  task: string | { _id: string; title: string };
  project: string | { _id: string; name: string };
  changedBy: User;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}
