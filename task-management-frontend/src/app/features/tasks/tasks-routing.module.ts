import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskList } from './task-list/task-list.component';
import { TaskForm } from './task-form/task-form.component';

const routes: Routes = [
  { path: '', component: TaskList },        // /tasks
  { path: 'new', component: TaskForm },     // /tasks/new?projectId=xxx
  { path: ':id/edit', component: TaskForm } // /tasks/:id/edit
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
