import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


export * from './member-verify.types';
import { VerifiedMemberData } from './member-verify.types';

@Component({
    selector: 'app-member-verify',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
    templateUrl: './template.html',
    styleUrl: './style.scss',
})
export class MemberVerifyComponent implements OnInit {
    member = signal<VerifiedMemberData | null>(null);

    constructor(private readonly _route: ActivatedRoute) { }

    ngOnInit(): void {
        this._route.queryParams.subscribe((params) => {
            const phone = params['phone'] || params['code'] || '010843612';
            const nameKh = params['name_kh'] || 'ពិសិដ្ឋ បញ្ញាវ័ន្ត';
            const nameEn = params['name_en'] || 'PISETH PANHAVORN';
            const email = params['email'] || 'pisethpanhavorn544@gmail.com';
            const gender = params['gender'] || 'ប្រុស';

            this.member.set({
                id: params['id'] || '2',
                code: `CCN-${phone}`,
                name_kh: nameKh,
                name_en: nameEn,
                gender: gender,
                nationality: 'ខ្មែរ',
                dob: '០៦ មករា ១៩៩៦',
                pob: 'រាជធានីភ្នំពេញ',
                phone: phone,
                email: email,
                organization_kh: 'ប្រព័ន្ធគ្រប់គ្រងការងារ WMS DIGITECHKH',
                organization_en: 'WMS DIGITECHKH',
                role_title: 'សមាជិកប្រព័ន្ធ (Core Member)',
                status: 'សុពលភាពសកម្ម (Active Verified)',
                valid_until: '៣១ ធ្នូ ២០២៧',
                avatar_url: '/images/placeholder/avatar.jpg',
            });
        });
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = '/images/placeholder/avatar.jpg';
    }

    onLogoError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'https://ui-avatars.com/api/?name=WMS&background=0b5c9e&color=fff';
    }
}
