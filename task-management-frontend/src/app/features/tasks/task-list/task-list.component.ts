import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TasksService } from '@core/services/tasks.service';
import { ProjectsService } from '@core/services/projects.service';
import { Task, TaskStatus, TaskPriority, Project } from '@core/models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '@shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent, SkeletonLoaderComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskList implements OnInit {
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);

  isLoading = signal(true);
  errorMessage = signal('');

  // Filters — bound to dropdowns and search input
  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedProjectId = '';

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalTasks = signal(0);
  limit = 10;

  // Expose enums to template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  // Status options for the update dropdown on each task card
  statusOptions = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.DONE, label: 'Done' },
  ];

  // Valid transitions — mirrors the backend workflow rules
  validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
    [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
  };

  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // If navigated from project detail with ?projectId=xxx, pre-filter
    this.route.queryParams.subscribe((params) => {
      if (params['projectId']) {
        this.selectedProjectId = params['projectId'];
      }
      this.loadTasks();
    });

    this.loadProjects(); // for the project filter dropdown
  }

  loadTasks() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const filters = {
      search: this.searchTerm || undefined,
      status: (this.selectedStatus as TaskStatus) || undefined,
      priority: (this.selectedPriority as TaskPriority) || undefined,
      page: this.currentPage(),
      limit: this.limit,
    };

    const request$ = this.selectedProjectId
      ? this.tasksService.getByProject(this.selectedProjectId, filters)
      : this.tasksService.getAll(filters);

    request$.subscribe({
      next: (response) => {
        this.tasks.set(response.data.tasks);
        this.totalPages.set(response.data.pagination.totalPages);
        this.totalTasks.set(response.data.pagination.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load tasks.');
        this.isLoading.set(false);
      },
    });
  }

  loadProjects() {
    this.projectsService.getAll({ limit: 100 }).subscribe({
      next: (response) => {
        this.projects.set(response.data.projects);
      },
      error: () => {},
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadTasks();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadTasks();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.selectedProjectId = '';
    this.currentPage.set(1);
    this.loadTasks();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadTasks();
  }

  // Called when user clicks a status transition button on a task card
  updateStatus(task: Task, newStatus: TaskStatus) {
    this.tasksService.updateStatus(task._id, newStatus).subscribe({
      next: (response) => {
        // Update the task in the local array without re-fetching everything
        this.tasks.update(tasks => {
          const index = tasks.findIndex((t) => t._id === task._id);
          if (index !== -1) {
            const updated = [...tasks];
            updated[index] = response.data;
            return updated;
          }
          return tasks;
        });
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update status.');
      },
    });
  }

  deleteTask(task: Task) {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    this.tasksService.delete(task._id).subscribe({
      next: () => {
        // Remove from local array immediately — no need to re-fetch
        this.tasks.update(tasks => tasks.filter((t) => t._id !== task._id));
        this.totalTasks.update(t => t - 1);
      },
      error: () => alert('Failed to delete task.'),
    });
  }

  // Returns only the valid next statuses for a given task
  getNextStatuses(task: Task): TaskStatus[] {
    return this.validTransitions[task.status] || [];
  }

  getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.DONE]: 'Done',
    };
    return labels[status];
  }

  getProjectName(task: Task): string {
    if (typeof task.project === 'object' && task.project !== null) {
      return (task.project as any).name;
    }
    return '';
  }

  get hasFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedStatus ||
      this.selectedPriority ||
      this.selectedProjectId
    );
  }
}
