import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { AuthService } from '@core/services/auth.service';
import { DashboardStats, User } from '@core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  stats: DashboardStats | null = null;
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private projectsService: ProjectsService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.projectsService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load dashboard stats. Please try again later.';
        this.isLoading = false;
      },
    });
  }
  get completionPercentage(): number {
    if (!this.stats || this.stats.tasks.total === 0) {
      return 0;
    }
    return Math.round((this.stats.tasks.DONE / this.stats.tasks.total) * 100);
  }
}
