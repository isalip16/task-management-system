import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectList } from './project-list/project-list';
import { ProjectForm } from './project-form/project-form';
import { ProjectDetail } from './project-detail/project-detail';

@NgModule({
  declarations: [],
  imports: [CommonModule, ProjectsRoutingModule, ProjectList, ProjectForm, ProjectDetail],
})
export class ProjectsModule { }
