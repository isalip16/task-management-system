import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectList } from './project-list/project-list';
import { ProjectForm } from './project-form/project-form';
import { ProjectDetail } from './project-detail/project-detail';

const routes: Routes = [
  { path: '', component: ProjectList },
  { path: 'new', component: ProjectForm },
  { path: ':id', component: ProjectDetail },
  { path: ':id/edit', component: ProjectForm },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsRoutingModule { }
