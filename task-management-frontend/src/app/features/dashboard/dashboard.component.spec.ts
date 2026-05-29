import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard.component';
import { ProjectsService } from '@core/services/projects.service';
import { AuthService } from '@core/services/auth.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  const mockProjectsService = {
    getDashboardStats: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        totalProjects: 0,
        tasks: {
          TODO: 0,
          IN_PROGRESS: 0,
          DONE: 0,
          total: 0
        }
      }
    })
  };

  const mockAuthService = {
    getCurrentUser: () => ({
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'member',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

