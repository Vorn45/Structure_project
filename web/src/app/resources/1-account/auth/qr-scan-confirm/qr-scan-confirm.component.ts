import { CommonModule }                                                 from '@angular/common';
import { HttpClient }                                                   from '@angular/common/http';
import { Component, OnInit, inject, signal }                            from '@angular/core';
import { ActivatedRoute, RouterLink }                                   from '@angular/router';
import { MatIconModule }                                                from '@angular/material/icon';
import { MatButtonModule }                                              from '@angular/material/button';
import { env }                                                          from 'envs/env';

@Component({
    selector: 'auth-qr-scan-confirm',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
    template: `
        <div class="flex flex-col items-center justify-center p-6 text-center font-kantumruy min-h-[300px]">
            <!-- Loading -->
            <div *ngIf="isLoading()" class="flex flex-col items-center gap-4">
                <div class="size-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <p class="text-base text-slate-600 dark:text-slate-300">កំពុងដំណើរការផ្ទៀងផ្ទាត់ការចូល...</p>
            </div>

            <!-- Success -->
            <div *ngIf="!isLoading() && isSuccess()" class="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div class="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <mat-icon svgIcon="heroicons_outline:check-circle" class="icon-size-10"></mat-icon>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">ចូលប្រើប្រាស់ជោគជ័យ!</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    ការផ្ទៀងផ្ទាត់ត្រូវបានបញ្ចប់។ កុំព្យូទ័ររបស់អ្នកនឹងចូលទៅក្នុងប្រព័ន្ធដោយស្វ័យប្រវត្តិ។
                </p>
            </div>

            <!-- Error / Expired -->
            <div *ngIf="!isLoading() && !isSuccess()" class="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                <div class="size-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <mat-icon svgIcon="heroicons_outline:x-circle" class="icon-size-10"></mat-icon>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">មិនអាចចូលប្រើប្រាស់បានទេ</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    {{ errorMessage() || 'QR Code នេះផុតសុពលភាព ឬត្រូវបានប្រើប្រាស់រួចហើយ។' }}
                </p>
                <a routerLink="/auth/sign-in"
                    class="mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1c2b6b] hover:bg-[#152254] transition-colors">
                    ត្រឡប់ទៅទំព័រចូល
                </a>
            </div>
        </div>
    `,
})
export class QrScanConfirmComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly http = inject(HttpClient);

    readonly isLoading = signal<boolean>(true);
    readonly isSuccess = signal<boolean>(false);
    readonly errorMessage = signal<string>('');

    ngOnInit(): void {
        const token = this.route.snapshot.queryParams['token'] || this.route.snapshot.queryParams['qr_token'];
        if (!token) {
            this.isLoading.set(false);
            this.isSuccess.set(false);
            this.errorMessage.set('មិនមានទិន្នន័យ QR Code ត្រឹមត្រូវទេ។');
            return;
        }

        this.confirmLogin(token);
    }

    private confirmLogin(token: string): void {
        this.http.post<any>(`${env.API_BASE_URL}/account/profile/qr-login/scan`, { qr_token: token })
            .subscribe({
                next: (res) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(true);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(false);
                    const msg = err?.error?.message || err?.error?.response_msg;
                    this.errorMessage.set(msg || 'QR Code នេះផុតសុពលភាព ឬត្រូវបានប្រើប្រាស់រួចហើយ។');
                }
            });
    }
}
