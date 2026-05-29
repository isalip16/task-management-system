import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '@core/services/projects.service';
import { Project, ProjectStatus } from '@core/models';
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
})
export class ProjectList implements OnInit {
  projects: Project[] = [];
  isLoading = true;
  errorMessage = '';

  // Search and filter state
  searchTerm = '';
  selectedStatus = '';

  // Pagination state
  currentPage = 1;
  totalPages = 1;
  totalProjects = 0;
  limit = 9; // show 9 projects per page (3x3 grid)

  constructor(
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectsService
      .getAll({
        search: this.searchTerm || undefined,
        status: this.selectedStatus || undefined,
        page: this.currentPage,
        limit: this.limit,
      })
      .subscribe({
        next: (response) => {
          this.projects = response.data.projects;
          this.totalPages = response.data.pagination.totalPages;
          this.totalProjects = response.data.pagination.total;
          this.isLoading = false;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.errorMessage = 'Failed to load projects.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadProjects();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadProjects();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadProjects();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
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
