import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit {
  projectForm!: FormGroup;
  isLoading = signal(false);
  isLoadingProject = signal(false);
  errorMessage = signal('');
  projectId: string | null = null;

  get isEditMode(): boolean {
    return !!this.projectId;
  }

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.buildForm();
    this.projectId = this.route.snapshot.paramMap.get('id');

    if (this.isEditMode) {
      this.loadProject();
    }
  }

  buildForm() {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  loadProject() {
    this.isLoadingProject.set(true);

    this.projectsService.getOne(this.projectId!).subscribe({
      next: (response) => {
        const p = response.data;
        this.projectForm.patchValue({
          name: p.name,
          description: p.description || '',
        });
        this.isLoadingProject.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load project.');
        this.isLoadingProject.set(false);
      }
    });
  }

  get f() {
    return this.projectForm.controls;
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const payload = this.projectForm.value;
    const request$ = this.isEditMode
      ? this.projectsService.update(this.projectId!, payload)
      : this.projectsService.create(payload);

    request$.subscribe({
      next: (response) => {
        const id = this.isEditMode ? this.projectId! : response.data._id;
        this.router.navigate(['/projects', id]);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to save project.');
        this.isLoading.set(false);
      }
    });
  }
}