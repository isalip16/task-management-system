import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectList } from './project-list/project-list.component';
import { ProjectForm } from './project-form/project-form.component';
import { ProjectDetail } from './project-detail/project-detail.component';

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
