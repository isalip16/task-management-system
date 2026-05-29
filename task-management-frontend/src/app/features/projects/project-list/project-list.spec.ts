import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProjectList } from './project-list';
import { ProjectsService } from '@core/services/projects.service';

describe('ProjectList', () => {
  let component: ProjectList;
  let fixture: ComponentFixture<ProjectList>;

  const mockProjectsService = {
    getAll: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        projects: [],
        pagination: {
          page: 1,
          limit: 9,
          total: 0,
          totalPages: 1
        }
      }
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectList],
      providers: [
        provideRouter([]),
        { provide: ProjectsService, useValue: mockProjectsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
