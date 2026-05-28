import { NgModule } from '@angular/core';
import { DashboardRoutingModule } from './dashboard-routing-module';
import { Dashboard } from './dashboard'; // ← fixed path

// DashboardModule is the lazy-loaded entry point.
// Routes are defined in DashboardRoutingModule — not here.
// Dashboard is a standalone component so it's imported directly.
@NgModule({
  imports: [
    DashboardRoutingModule, // ← handles routing
    Dashboard               // ← registers the standalone component
  ]
})
export class DashboardModule {}