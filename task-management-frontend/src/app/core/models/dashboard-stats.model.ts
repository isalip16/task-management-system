import { TaskStatus } from './task.model';

export interface DashboardStats {
  totalProjects: number;
  tasks: Record<TaskStatus | 'total', number>;
}
