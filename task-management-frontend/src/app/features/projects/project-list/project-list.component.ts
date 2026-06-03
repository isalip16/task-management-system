import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '@core/services/projects.service';
import { AuthService } from '@core/services/auth.service';
import { Project, ProjectStatus, User } from '@core/models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectList implements OnInit {
  projects = signal<Project[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  currentUser = signal<User | null>(null);

  // Search and filter state
  searchTerm = '';
  selectedStatus = '';

  // Pagination state
  currentPage = signal(1);
  totalPages = signal(1);
  totalProjects = signal(0);
  limit = signal(9); // show 9 projects per page (3x3 grid)

  constructor(
    private projectsService: ProjectsService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadProjects();
  }

  canEdit(project: Project): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    const ownerId = typeof project.owner === 'object'
      ? project.owner._id
      : project.owner;
    return ownerId === user._id;
  }

  loadProjects() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectsService
      .getAll({
        search: this.searchTerm || undefined,
        status: this.selectedStatus || undefined,
        page: this.currentPage(),
        limit: this.limit(),
      })
      .subscribe({
        next: (response) => {
          this.projects.set(response.data.projects);
          this.totalPages.set(response.data.pagination.totalPages);
          this.totalProjects.set(response.data.pagination.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Failed to load projects.');
          this.isLoading.set(false);
        },
      });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadProjects();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadProjects();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage.set(1);
    this.loadProjects();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadProjects();
  }

  getStatusLabel(status: string): string {
    return status === ProjectStatus.ACTIVE ? 'Active' : 'Archived';
  }

  getInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  get hasFilters(): boolean {
    return !!this.searchTerm || !!this.selectedStatus;
  }
}
