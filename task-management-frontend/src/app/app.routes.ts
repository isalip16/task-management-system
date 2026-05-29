import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Public routes — no navbar, no guard
  {
    path: 'auth',
    loadChildren: () =>
      import('@features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Protected routes — all wrapped inside LayoutComponent (navbar lives here)
  // AuthGuard only needs to be here once — it covers all children
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('@features/projects/projects.module').then(m => m.ProjectsModule)
      },
      {
        path: 'tasks',
        loadChildren: () =>
          import('@features/tasks/tasks.module').then(m => m.TasksModule)
      },
    ]
  },

  { path: '**', redirectTo: '/dashboard' }
];