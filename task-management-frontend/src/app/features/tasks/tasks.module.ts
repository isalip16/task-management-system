import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksRoutingModule } from './tasks-routing.module';
import { TaskList } from './task-list/task-list.component';
import { TaskForm } from './task-form/task-form.component';

@NgModule({
  imports: [CommonModule, TasksRoutingModule, TaskList, TaskForm],
})
export class TasksModule {}
