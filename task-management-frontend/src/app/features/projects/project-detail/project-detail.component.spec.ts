import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProjectDetail } from './project-detail.component';
import { ProjectsService } from '@core/services/projects.service';
import { TasksService } from '@core/services/tasks.service';
import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;

  const mockProjectsService = {
    getOne: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        _id: '123',
        name: 'Test Project',
        description: 'Test Project Description',
        status: 'active',
        owner: { _id: '1', name: 'Owner User' },
        members: [],
        createdAt: new Date().toISOString()
      }
    }),
    delete: () => of({ success: true })
  };

  const mockTasksService = {
    getByProject: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        tasks: []
      }
    }),
    getActivityLogs: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        logs: [],
        pagination: {
          totalPages: 1
        }
      }
    })
  };

  const mockAuthService = {
    getCurrentUser: () => ({
      _id: '1',
      name: 'Owner User',
      email: 'owner@example.com',
      role: 'member',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: () => '123'
      }
    }
  };

  const mockRouter = {
    navigate: () => Promise.resolve(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
