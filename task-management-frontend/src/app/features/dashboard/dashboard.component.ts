import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { AuthService } from '@core/services/auth.service';
import { TasksService } from '@core/services/tasks.service';
import { DashboardStats, User, Project, Task } from '@core/models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  stats = signal<DashboardStats | null>(null);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  recentProjects = signal<Project[]>([]);
  isLoadingProjects = signal(true);
  myTasks = signal<Task[]>([]);
  isLoadingTasks = signal(true);
  errorMessage = signal('');

  completionPercentage = computed(() => {
    const currentStats = this.stats();
    if (!currentStats || currentStats.tasks.total === 0) {
      return 0;
    }
    return Math.round((currentStats.tasks.DONE / currentStats.tasks.total) * 100);
  });

  constructor(
    private projectsService: ProjectsService,
    private authService: AuthService,
    private tasksService: TasksService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    this.loadStats();
    this.loadRecentProjects();
    if (user) {
      this.loadMyTasks(user._id);
    }
  }

  loadStats() {
    this.isLoading.set(true);
    this.projectsService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load dashboard stats. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  loadRecentProjects() {
    this.isLoadingProjects.set(true);
    this.projectsService.getAll({ limit: 3 }).subscribe({
      next: (response) => {
        this.recentProjects.set(response.data.projects);
        this.isLoadingProjects.set(false);
      },
      error: () => {
        this.isLoadingProjects.set(false);
      }
    });
  }

  loadMyTasks(userId: string) {
    this.isLoadingTasks.set(true);
    this.tasksService.getAll({ assignedTo: userId, limit: 5 }).subscribe({
      next: (response) => {
        this.myTasks.set(response.data.tasks);
        this.isLoadingTasks.set(false);
      },
      error: () => {
        this.isLoadingTasks.set(false);
      }
    });
  }

  getProjectName(task: Task): string {
    if (typeof task.project === 'object' && task.project !== null) {
      return (task.project as any).name;
    }
    return '';
  }
}
