import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { TasksService } from '@core/services/tasks.service';
import { AuthService } from '@core/services/auth.service';
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
    SkeletonLoaderComponent
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

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private authService: AuthService,
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

  getLogIcon(toStatus: string): string {
    const icons: Record<string, string> = {
      [TaskStatus.TODO]: 'schedule',
      [TaskStatus.IN_PROGRESS]: 'autorenew',
      [TaskStatus.DONE]: 'check_circle'
    };
    return icons[toStatus] || 'help';
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
