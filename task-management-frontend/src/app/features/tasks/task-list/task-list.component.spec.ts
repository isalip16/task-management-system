import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskList } from './task-list.component';
import { TasksService } from '@core/services/tasks.service';
import { ProjectsService } from '@core/services/projects.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('TaskList', () => {
  let component: TaskList;
  let fixture: ComponentFixture<TaskList>;

  const mockTasksService = {
    getAll: () => of({ data: { tasks: [], pagination: { totalPages: 1, total: 0 } } }),
    getByProject: () => of({ data: { tasks: [], pagination: { totalPages: 1, total: 0 } } })
  };

  const mockProjectsService = {
    getAll: () => of({ data: { projects: [] } })
  };

  const mockActivatedRoute = {
    queryParams: of({ projectId: '123' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskList],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
