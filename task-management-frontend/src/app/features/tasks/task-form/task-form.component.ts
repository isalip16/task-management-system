import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TasksService } from '@core/services/tasks.service';
import { ProjectsService } from '@core/services/projects.service';
import { UsersService } from '@core/services/users.service';
import { TaskStatus, TaskPriority, Project, User } from '@core/models';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm implements OnInit {
  taskForm!: FormGroup;
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);

  isLoading = signal(false);
  isLoadingData = signal(true);
  errorMessage = signal('');

  // Detect mode from URL
  // /tasks/new          → create mode (taskId is null)
  // /tasks/:id/edit     → edit mode   (taskId has a value)
  taskId: string | null = null;

  // Pre-selected project from query param (?projectId=xxx)
  preselectedProjectId: string | null = null;

  // Expose enums to template
  TaskPriority = TaskPriority;
  TaskStatus = TaskStatus;

  // Valid transitions for the status dropdown in edit mode
  validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
    [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
  };

  currentStatus = signal<TaskStatus>(TaskStatus.TODO);

  get isEditMode(): boolean { return !!this.taskId; }

  goBack() {
    window.history.back();
  }

  constructor(
    private fb: FormBuilder,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.buildForm();

    // Read :id from route params (edit mode)
    this.taskId = this.route.snapshot.paramMap.get('id');

    // Read ?projectId from query params (pre-select project on create)
    this.preselectedProjectId = this.route.snapshot.queryParamMap.get('projectId');

    // Load dropdown data (projects + users) in parallel
    this.loadFormData();
  }

  buildForm() {
    this.taskForm = this.fb.group({
      title:       ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      projectId:   ['', [Validators.required]],
      priority:    [TaskPriority.MEDIUM],
      assignedTo:  [''],
      dueDate:     [''],
    });
  }

  loadFormData() {
    this.isLoadingData.set(true);

    // Load projects for the dropdown
    this.projectsService.getAll({ limit: 100 }).subscribe({
      next: (res) => {
        this.projects.set(res.data.projects);

        // Pre-select project if ?projectId was in the URL
        if (this.preselectedProjectId) {
          this.taskForm.patchValue({ projectId: this.preselectedProjectId });
        }

        // Load users for assigned-to dropdown
        this.usersService.getAll({ limit: 100 }).subscribe({
          next: (userRes) => {
            this.users.set(userRes.data.users);

            // If edit mode, load the task data AFTER dropdowns are ready
            if (this.isEditMode) {
              this.loadTask();
            } else {
              this.isLoadingData.set(false);
            }
          },
          error: () => {
            if (this.isEditMode) this.loadTask();
            else {
              this.isLoadingData.set(false);
            }
          }
        });
      },
      error: () => {
        this.isLoadingData.set(false);
        this.errorMessage.set('Failed to load form data.');
      }
    });
  }

  loadTask() {
    this.tasksService.getOne(this.taskId!).subscribe({
      next: (response) => {
        const task = response.data;
        this.currentStatus.set(task.status);

        // patchValue fills only the fields we specify
        this.taskForm.patchValue({
          title:       task.title,
          description: task.description || '',
          projectId:   typeof task.project === 'object'
                         ? (task.project as any)._id
                         : task.project,
          priority:    task.priority,
          assignedTo:  task.assignedTo
                         ? (typeof task.assignedTo === 'object'
                             ? (task.assignedTo as any)._id
                             : task.assignedTo)
                         : '',
          dueDate:     task.dueDate
                         ? new Date(task.dueDate).toISOString().split('T')[0]
                         : '',
        });

        this.isLoadingData.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load task.');
        this.isLoadingData.set(false);
      }
    });
  }

  get f() { return this.taskForm.controls; }

  // Returns the valid next statuses for the current task
  get availableStatuses(): TaskStatus[] {
    return this.validTransitions[this.currentStatus()] || [];
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.taskForm.value;

    const payload = {
      title:       formValue.title,
      description: formValue.description || undefined,
      projectId:   formValue.projectId,
      priority:    formValue.priority,
      assignedTo:  formValue.assignedTo || undefined,
      dueDate:     formValue.dueDate || undefined,
    };

    const request$ = this.isEditMode
      ? this.tasksService.update(this.taskId!, payload)
      : this.tasksService.create(payload);

    request$.subscribe({
      next: () => {
        // Navigate back to the project detail if we know the project
        const projectId = formValue.projectId;
        if (projectId) {
          this.router.navigate(['/projects', projectId]);
        } else {
          this.router.navigate(['/tasks']);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save task.');
        this.isLoading.set(false);
      }
    });
  }

  // Separate status update — goes through workflow endpoint
  onStatusChange(newStatus: TaskStatus) {
    if (!this.taskId) return;

    this.tasksService.updateStatus(this.taskId, newStatus).subscribe({
      next: (response) => {
        this.currentStatus.set(response.data.status);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update status.');
      }
    });
  }
}