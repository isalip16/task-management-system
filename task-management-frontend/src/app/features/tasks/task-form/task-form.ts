import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TasksService } from '@core/services/tasks.service';
import { ProjectsService } from '@core/services/projects.service';
import { Task, TaskPriority, TaskStatus, User } from '@core/models';
import { PageHeaderComponent } from '@shared/components/page-header/page-header';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent
  ],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm implements OnInit {
  taskForm!: FormGroup;
  isLoading = false;
  isLoadingData = true;
  errorMessage = '';
  
  projectId: string | null = null;
  taskId: string | null = null;
  projectMembers: User[] = [];
  priorities = Object.values(TaskPriority);
  statuses = Object.values(TaskStatus);

  get isEditMode(): boolean {
    return !!this.taskId;
  }

  constructor(
    private fb: FormBuilder,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.buildForm();
    
    this.route.queryParams.subscribe(params => {
      const pId = params['projectId'];
      const tId = params['id'];

      if (tId) {
        this.taskId = tId;
        this.loadTaskAndMembers();
      } else if (pId) {
        this.projectId = pId;
        this.loadProjectMembers(pId);
      } else {
        this.errorMessage = 'Invalid page parameters. Project context is required.';
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  buildForm() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      priority: [TaskPriority.MEDIUM, [Validators.required]],
      status: [TaskStatus.TODO, [Validators.required]],
      assignedTo: ['', []],
      dueDate: ['', []],
    });
  }

  loadProjectMembers(projId: string) {
    this.isLoadingData = true;
    this.projectsService.getOne(projId).subscribe({
      next: (response) => {
        this.projectMembers = response.data.members;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load project members.';
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTaskAndMembers() {
    this.isLoadingData = true;
    this.tasksService.getOne(this.taskId!).subscribe({
      next: (taskResponse) => {
        const task = taskResponse.data;
        const projId = typeof task.project === 'object' ? task.project._id : task.project;
        this.projectId = projId;

        this.projectsService.getOne(projId).subscribe({
          next: (projResponse) => {
            this.projectMembers = projResponse.data.members;
            
            let formattedDate = '';
            if (task.dueDate) {
              const d = new Date(task.dueDate);
              formattedDate = d.toISOString().substring(0, 10);
            }

            this.taskForm.patchValue({
              title: task.title,
              description: task.description || '',
              priority: task.priority,
              status: task.status,
              assignedTo: task.assignedTo?._id || '',
              dueDate: formattedDate,
            });

            this.isLoadingData = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.errorMessage = 'Failed to load project details.';
            this.isLoadingData = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.errorMessage = 'Failed to load task details.';
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  get f() {
    return this.taskForm.controls;
  }

  onSubmit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.taskForm.value;

    const payload: any = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority,
      status: formValue.status,
      assignedTo: formValue.assignedTo || null,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : null,
    };

    const request$ = this.isEditMode
      ? this.tasksService.update(this.taskId!, payload)
      : this.tasksService.create({ ...payload, projectId: this.projectId! });

    request$.subscribe({
      next: () => {
        this.router.navigate(['/projects', this.projectId]);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save task.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteTask() {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

    this.isLoading = true;
    this.tasksService.delete(this.taskId!).subscribe({
      next: () => {
        this.router.navigate(['/projects', this.projectId]);
      },
      error: () => {
        this.errorMessage = 'Failed to delete task.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
