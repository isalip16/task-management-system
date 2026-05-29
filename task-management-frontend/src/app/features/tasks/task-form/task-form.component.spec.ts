import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskForm } from './task-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TasksService } from '@core/services/tasks.service';
import { ProjectsService } from '@core/services/projects.service';
import { of } from 'rxjs';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;

  const mockTasksService = {
    getOne: () => of({ data: {} }),
    create: () => of({}),
    update: () => of({}),
    delete: () => of({})
  };

  const mockProjectsService = {
    getOne: () => of({ data: { members: [] } })
  };

  const mockActivatedRoute = {
    queryParams: of({ projectId: '123' })
  };

  const mockRouter = {
    navigate: () => {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
