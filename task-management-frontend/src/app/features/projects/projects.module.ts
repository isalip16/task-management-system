import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectList } from './project-list/project-list.component';
import { ProjectForm } from './project-form/project-form.component';
import { ProjectDetail } from './project-detail/project-detail.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, ProjectsRoutingModule, ProjectList, ProjectForm, ProjectDetail],
})
export class ProjectsModule { }
