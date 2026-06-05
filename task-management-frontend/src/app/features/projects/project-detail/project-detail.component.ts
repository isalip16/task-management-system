import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '@core/services/projects.service';
import { TasksService } from '@core/services/tasks.service';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { Project, Task, TaskStatus, User, ActivityLog } from '@core/models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    SkeletonLoaderComponent,
    FormsModule
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail implements OnInit {
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  isLoadingTasks = signal(true);
  errorMessage = signal('');

  activityLogs = signal<ActivityLog[]>([]);
  isLoadingLogs = signal(true);
  logsPage = signal(1);
  totalLogPages = signal(1);
  projectId = '';

  systemUsers = signal<User[]>([]);
  selectedUserIdToAdd = '';

  TaskStatus = TaskStatus;

  isOwner = computed(() => {
    const proj = this.project();
    const user = this.currentUser();
    if (!proj || !user) return false;
    const ownerId = typeof proj.owner === 'object'
      ? proj.owner._id
      : proj.owner;
    return ownerId === user._id;
  });

  isAdmin = computed(() => {
    return this.currentUser()?.role === 'admin';
  });

  availableUsersToAdd = computed(() => {
    const all = this.systemUsers();
    const members = this.project()?.members || [];
    const memberIds = new Set(members.map(m => m._id));
    return all.filter(u => !memberIds.has(u._id));
  });

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private authService: AuthService,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.loadProject();
    this.loadTasks();
    this.loadActivityLogs();
  }

  loadProject() {
    this.isLoading.set(true);
    this.projectsService.getOne(this.projectId).subscribe({
      next: (response) => {
        this.project.set(response.data);
        this.isLoading.set(false);
        if (this.isOwner() || this.isAdmin()) {
          this.loadSystemUsers();
        }
      },
      error: () => {
        this.errorMessage.set('Failed to load project.');
        this.isLoading.set(false);
      }
    });
  }

  loadTasks() {
    this.isLoadingTasks.set(true);
    this.tasksService.getByProject(this.projectId).subscribe({
      next: (response) => {
        this.tasks.set(response.data.tasks);
        this.isLoadingTasks.set(false);
      },
      error: () => { 
        this.isLoadingTasks.set(false);
      }
    });
  }

  loadActivityLogs() {
    this.isLoadingLogs.set(true);
    this.tasksService.getActivityLogs(this.projectId, this.logsPage()).subscribe({
      next: (response) => {
        this.activityLogs.set(response.data.logs);
        this.totalLogPages.set(response.data.pagination.totalPages);
        this.isLoadingLogs.set(false);
      },
      error: () => {
        this.isLoadingLogs.set(false);
      }
    });
  }

  loadMoreLogs() {
    if(this.logsPage() >= this.totalLogPages()) return;
    this.logsPage.update(p => p + 1);
    this.tasksService.getActivityLogs(this.projectId, this.logsPage()).subscribe({
      next: (response) => {
        this.activityLogs.update(logs => [...logs, ...response.data.logs]);
        this.totalLogPages.set(response.data.pagination.totalPages);
      },
      error: () => {}
    });
  }

  loadSystemUsers() {
    this.usersService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.systemUsers.set(res.data.users);
      },
      error: () => {}
    });
  }

  addMember() {
    if (!this.selectedUserIdToAdd) return;
    this.projectsService.addMember(this.projectId, this.selectedUserIdToAdd).subscribe({
      next: () => {
        this.selectedUserIdToAdd = '';
        this.loadProject(); // Reload project to update members list and count
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add member.');
      }
    });
  }

  removeMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    this.projectsService.removeMember(this.projectId, memberId).subscribe({
      next: () => {
        this.loadProject(); // Reload project to update members list and count
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to remove member.');
      }
    });
  }

  getLogIcon(toStatus: string): string {
    const icons: Record<string, string> = {
      [TaskStatus.TODO]: 'pi-clock',
      [TaskStatus.IN_PROGRESS]: 'pi-refresh',
      [TaskStatus.DONE]: 'pi-check-circle'
    };
    return icons[toStatus] || 'pi-question-circle';
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  deleteProject() {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) return;

    this.projectsService.delete(this.projectId).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => alert('Failed to delete project.')
    });
  }
}
