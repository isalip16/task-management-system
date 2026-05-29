import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProjectForm } from './project-form.component';
import { ProjectsService } from '@core/services/projects.service';

describe('ProjectForm', () => {
  let component: ProjectForm;
  let fixture: ComponentFixture<ProjectForm>;

  const mockProjectsService = {
    getOne: () => of({
      success: true,
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: {
        _id: '1',
        name: 'Test Project',
        description: 'Test Description',
        status: 'active',
        owner: { _id: 'owner-1', name: 'Owner' },
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }),
    update: () => of({
      success: true,
      message: 'Updated',
      timestamp: new Date().toISOString(),
      data: { _id: '1', name: 'Test Project' }
    }),
    create: () => of({
      success: true,
      message: 'Created',
      timestamp: new Date().toISOString(),
      data: { _id: '1', name: 'Test Project' }
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectForm],
      providers: [
        provideRouter([]),
        { provide: ProjectsService, useValue: mockProjectsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
