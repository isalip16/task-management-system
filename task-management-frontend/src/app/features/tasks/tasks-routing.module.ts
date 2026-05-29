import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskForm } from './task-form/task-form';

const routes: Routes = [
  { path: '', component: TaskForm }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
