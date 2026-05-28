import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [NavbarComponent, RouterOutlet],
    templateUrl: './layout.html',
    styleUrl: './layout.scss'
})
export class LayoutComponent {}