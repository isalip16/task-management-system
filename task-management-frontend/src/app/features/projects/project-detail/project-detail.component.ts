import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
  project: Project | null = null;
  tasks: Task[] = [];
  currentUser: User | null = null;
  isLoading = true;
  isLoadingTasks = true;
  errorMessage = '';

  activityLogs: ActivityLog[] = [];
  isLoadingLogs = true;
  logsPage = 1;
  totalLogPages = 1;
  projectId = '';

  TaskStatus = TaskStatus;

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.projectId = this.route.snapshot.paramMap.get('id')!;
    this.loadProject();
    this.loadTasks();
    this.loadActivityLogs();
  }

  loadProject() {
    this.isLoading = true;
    this.projectsService.getOne(this.projectId).subscribe({
      next: (response) => {
        this.project = response.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load project.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTasks() {
    this.isLoadingTasks = true;
    this.tasksService.getByProject(this.projectId).subscribe({
      next: (response) => {
        this.tasks = response.data.tasks;
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      },
      error: () => { 
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadActivityLogs() {
    this.isLoadingLogs = true;
    this.tasksService.getActivityLogs(this.projectId, this.logsPage).subscribe({
      next: (response) => {
        this.activityLogs = response.data.logs;
        this.totalLogPages = response.data.pagination.totalPages;
        this.isLoadingLogs = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingLogs = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMoreLogs() {
    if(this.logsPage>= this.totalLogPages) return;
    this.logsPage++;
    this.tasksService.getActivityLogs(this.projectId, this.logsPage).subscribe({
      next: (response) => {
        this.activityLogs = [...this.activityLogs, ...response.data.logs];
        this.totalLogPages = response.data.pagination.totalPages;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
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
    return this.tasks.filter(t => t.status === status);
  }

  get isOwner(): boolean {
    if (!this.project || !this.currentUser) return false;
    const ownerId = typeof this.project.owner === 'object'
      ? this.project.owner._id
      : this.project.owner;
    return ownerId === this.currentUser._id;
  }

  deleteProject() {
    if (!confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) return;

    this.projectsService.delete(this.projectId).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: () => alert('Failed to delete project.')
    });
  }
}
