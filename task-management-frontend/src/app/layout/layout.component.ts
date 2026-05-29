import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [NavbarComponent, RouterOutlet],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent {}