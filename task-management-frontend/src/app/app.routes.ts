import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Lazy-loaded modules — Angular only downloads these when the user navigates here
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard], 
    loadChildren: () =>
      import('@features/dashboard/dashboard-module').then(m => m.DashboardModule)
  },
  {
    path: 'projects',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('@features/projects/projects-module').then(m => m.ProjectsModule)
  },
  {
    path: 'tasks',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('@features/tasks/tasks-module').then(m => m.TasksModule)
  },
  { path: '**', redirectTo: '/dashboard' } // fallback for unknown routes
];