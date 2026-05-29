import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectsService } from '@core/services/projects.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent
  ],
  templateUrl: './project-form.html',
  styleUrl: './project-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit {
  projectForm!: FormGroup;
  isLoading = false;
  isLoadingProject = false;
  errorMessage = '';
  projectId: string | null = null;

  get isEditMode(): boolean {
    return !!this.projectId;
  }

  constructor(
    private fb: FormBuilder,
    private projectsService: ProjectsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
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
    this.isLoadingProject = true;

    this.projectsService.getOne(this.projectId!).subscribe({
      next: (response) => {
        const p = response.data;
        this.projectForm.patchValue({
          name: p.name,
          description: p.description || '',
        });
        this.isLoadingProject = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load project.';
        this.isLoadingProject = false;
        this.cdr.detectChanges();
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

    this.isLoading = true;
    this.errorMessage = '';

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
        this.errorMessage = err.error?.message || 'Failed to save project.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}