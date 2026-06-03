import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { AuthService } from '@core/services/auth.service';
import { DashboardStats, User } from '@core/models';
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
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadStats();
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
}
