import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models';

@Component ({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})

export class NavbarComponent implements OnInit {
    currentUser: User | null = null;

    menuOpen = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(){
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    logout() {
        this.authService.logout();
    }

    get firstName(): string {
        return this.currentUser?.name?.split(' ')[0] || 'User';
    }

    toggleMenu(){
        this.menuOpen = !this.menuOpen;
    }
}