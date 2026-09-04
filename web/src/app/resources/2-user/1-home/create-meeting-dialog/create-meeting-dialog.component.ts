import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';
import { UserHomeService } from '../home.service';

export interface CreateMeetingDialogData {
    user?: any;
    startDirectCall?: boolean;
}

export interface ScheduledMeeting {
    id: string;
    title: string;
    type: 'wms' | 'google' | 'zoom';
    date: string;
    time: string;
    duration: string;
    roomCode: string;
    roomUrl: string;
    organizer: string;
    status: 'live' | 'upcoming' | 'completed';
    participants: { name: string; avatar?: string; role?: string }[];
    agenda?: string;
}

@Component({
    selector: 'app-create-meeting-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDividerModule,
        SideDialogCloseButtonComponent,
    ],
    template: `
        <div class="w-full h-full flex flex-col bg-white dark:bg-slate-900 font-kantumruy text-[16px] font-normal relative overflow-hidden" style="font-family: 'Kantumruy Pro', sans-serif;">
            
            <!-- ========================================================= -->
            <!-- 1. DIALOG HEADER (Exact Side Drawer Header Style)        -->
            <!-- ========================================================= -->
            <div mat-dialog-title
                class="w-full flex justify-center items-center min-h-14 max-h-14 h-14 border-b border-slate-200 dark:border-slate-800 m-0 !py-0 font-kantumruy bg-white dark:bg-slate-900 relative px-4 shrink-0">
                <span class="w-full text-center text-[20px] font-medium font-kantumruy text-slate-800 dark:text-slate-200">
                    បង្កើតអង្គប្រជំុ
                </span>
            </div>

            <!-- Standard Side Drawer Close Button (Top-left floating circular button) -->
            <shared-side-dialog-close-button [isReturn]="false"></shared-side-dialog-close-button>

            <!-- ========================================================= -->
            <!-- 2. NAVIGATION PILLS (Header Tabs)                         -->
            <!-- ========================================================= -->
            <div *ngIf="!inCall()" class="px-5 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 bg-slate-50/70 dark:bg-slate-800/40 font-kantumruy">
                <button
                    type="button"
                    (click)="activeTab.set('create')"
                    class="px-4 py-2.5 text-[16px] font-medium font-kantumruy border-b-2 transition-all flex items-center gap-2 select-none"
                    [ngClass]="activeTab() === 'create'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
                >
                    <mat-icon svgIcon="mdi:plus-circle-outline" class="icon-size-5"></mat-icon>
                    <span>បង្កើតអង្គប្រជុំ</span>
                </button>

                <button
                    type="button"
                    (click)="activeTab.set('instant')"
                    class="px-4 py-2.5 text-[16px] font-medium font-kantumruy border-b-2 transition-all flex items-center gap-2 select-none"
                    [ngClass]="activeTab() === 'instant'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
                >
                    <mat-icon svgIcon="mdi:video-wireless-outline" class="icon-size-5"></mat-icon>
                    <span>បន្ទប់ប្រជុំភ្លាមៗ</span>
                </button>

                <button
                    type="button"
                    (click)="activeTab.set('schedule')"
                    class="px-4 py-2.5 text-[16px] font-medium font-kantumruy border-b-2 transition-all flex items-center gap-2 select-none"
                    [ngClass]="activeTab() === 'schedule'
                        ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'"
                >
                    <mat-icon svgIcon="mdi:calendar-clock-outline" class="icon-size-5"></mat-icon>
                    <span>កាលវិភាគប្រជុំ</span>
                    <span class="ml-1 px-2 py-0.5 rounded-full text-[13px] bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-medium">
                        {{ scheduledMeetings().length }}
                    </span>
                </button>
            </div>

            <!-- ========================================================= -->
            <!-- 3. DIALOG CONTENT BODY (Scrollable)                      -->
            <!-- ========================================================= -->
            <mat-dialog-content class="w-full !m-0 !p-0 overflow-y-auto flex-1 bg-white dark:bg-slate-900 font-kantumruy text-[16px]">
                
                <!-- Success Toast Alert -->
                <div *ngIf="successMessage()" class="m-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-[15px] font-kantumruy">
                    <div class="flex items-center gap-2.5">
                        <mat-icon svgIcon="mdi:check-circle" class="icon-size-5 text-emerald-600 dark:text-emerald-400"></mat-icon>
                        <span>{{ successMessage() }}</span>
                    </div>
                    <button mat-icon-button (click)="successMessage.set('')" class="text-emerald-600 !w-7 !h-7">
                        <mat-icon svgIcon="mdi:close" class="icon-size-4"></mat-icon>
                    </button>
                </div>

                <!-- ----------------------------------------------------- -->
                <!-- VIEW 1: CREATE MEETING FORM                           -->
                <!-- ----------------------------------------------------- -->
                <div *ngIf="activeTab() === 'create' && !inCall()" class="p-5 space-y-6 font-kantumruy">
                    
                    <!-- Cover Photo / Header Graphic -->
                    <div class="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-800 to-[#1c2b6b] text-white p-5 shadow-sm relative overflow-hidden font-kantumruy">
                        <div class="absolute right-0 top-0 text-white/5 pointer-events-none -mr-6 -mt-6">
                            <mat-icon svgIcon="mdi:video-vintage" class="icon-size-40"></mat-icon>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[13px] font-medium tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full text-purple-100">
                                ប្រព័ន្ធប្រជុំ WMS CONFERENCE
                            </span>
                            <h3 class="text-[20px] font-medium text-white mt-2.5 leading-tight">
                                រៀបចំកាលវិភាគ និង បង្កើតបន្ទប់ប្រជុំ
                            </h3>
                            <p class="text-[14px] text-purple-200/90 mt-1.5 leading-normal">
                                បង្កើតតំណភ្ជាប់សុវត្ថិភាពសម្រាប់ក្រុមការងារ ផ្ញើការអញ្ជើញ និងភ្ជាប់ជាមួយប្រព័ន្ធ PMS
                            </p>
                        </div>
                    </div>

                    <!-- Meeting Form Inputs -->
                    <div class="space-y-5 text-[16px] font-kantumruy">
                        
                        <!-- Title -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ប្រធានបទ ឬ ចំណងជើងអង្គប្រជុំ <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <mat-icon svgIcon="mdi:format-title" class="absolute left-3.5 top-3.5 icon-size-5 text-slate-400"></mat-icon>
                                <input
                                    type="text"
                                    [(ngModel)]="formTitle"
                                    placeholder="ឧ. ប្រជុំពិនិត្យវឌ្ឍនភាពការងារគម្រោងប្រចាំសប្តាហ៍..."
                                    class="w-full pl-11 pr-4 py-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                        </div>

                        <!-- Platform -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                ប្រភេទបន្ទប់ប្រជុំ (Platform)
                            </label>
                            <div class="grid grid-cols-3 gap-3">
                                <div
                                    (click)="formPlatform.set('wms')"
                                    class="p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 select-none font-kantumruy"
                                    [ngClass]="formPlatform() === 'wms'
                                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <mat-icon svgIcon="mdi:shield-check" class="icon-size-6 text-purple-600 dark:text-purple-400"></mat-icon>
                                    <p class="font-medium text-[15px]">WMS Room</p>
                                    <p class="text-[12px] text-slate-400">ផ្ទៃក្នុង</p>
                                </div>

                                <div
                                    (click)="formPlatform.set('google')"
                                    class="p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 select-none font-kantumruy"
                                    [ngClass]="formPlatform() === 'google'
                                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <mat-icon svgIcon="mdi:video" class="icon-size-6 text-blue-600 dark:text-blue-400"></mat-icon>
                                    <p class="font-medium text-[15px]">Google Meet</p>
                                    <p class="text-[12px] text-slate-400">google.com</p>
                                </div>

                                <div
                                    (click)="formPlatform.set('zoom')"
                                    class="p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 select-none font-kantumruy"
                                    [ngClass]="formPlatform() === 'zoom'
                                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'"
                                >
                                    <mat-icon svgIcon="mdi:laptop" class="icon-size-6 text-sky-600 dark:text-sky-400"></mat-icon>
                                    <p class="font-medium text-[15px]">Zoom Cloud</p>
                                    <p class="text-[12px] text-slate-400">zoom.us</p>
                                </div>
                            </div>
                        </div>

                        <!-- Date & Time & Duration -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    កាលបរិច្ឆេទ
                                </label>
                                <input
                                    type="date"
                                    [(ngModel)]="formDate"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    ម៉ោងចាប់ផ្តើម
                                </label>
                                <input
                                    type="time"
                                    [(ngModel)]="formTime"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            <div>
                                <label class="block font-normal text-slate-800 dark:text-slate-200 mb-1.5 text-[16px]">
                                    រយៈពេល
                                </label>
                                <select
                                    [(ngModel)]="formDuration"
                                    class="w-full px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                >
                                    <option value="30 នាទី">៣០ នាទី</option>
                                    <option value="45 នាទី">៤៥ នាទី</option>
                                    <option value="1 ម៉ោង">១ ម៉ោង</option>
                                    <option value="2 ម៉ោង">២ ម៉ោង</option>
                                </select>
                            </div>
                        </div>

                        <!-- Room Link Preview with Copy -->
                        <div class="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2 font-kantumruy">
                            <div class="flex items-center justify-between">
                                <span class="font-normal text-[16px] text-purple-800 dark:text-purple-200 flex items-center gap-1.5">
                                    <mat-icon svgIcon="mdi:link-variant" class="icon-size-4.5 text-purple-600"></mat-icon>
                                    <span>តំណភ្ជាប់បន្ទប់ប្រជុំ</span>
                                </span>
                                <span class="text-[13px] text-slate-400 font-mono">កូដ៖ {{ generatedRoomCode }}</span>
                            </div>
                            <div class="flex items-center gap-2.5">
                                <input
                                    type="text"
                                    readonly
                                    [value]="generatedRoomUrl"
                                    class="flex-1 px-3 py-2 text-[15px] rounded-lg border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono select-all focus:outline-none"
                                />
                                <button
                                    type="button"
                                    (click)="copyLink(generatedRoomUrl)"
                                    class="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[15px] font-medium font-kantumruy flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                >
                                    <mat-icon [svgIcon]="copied() ? 'mdi:check' : 'mdi:content-copy'" class="icon-size-4"></mat-icon>
                                    <span>{{ copied() ? 'បានចម្លង' : 'ចម្លង' }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Invite Members -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                អញ្ជើញសមាជិក ({{ selectedMemberIds().length }} នាក់)
                            </label>
                            <div class="grid grid-cols-2 gap-2.5">
                                <div
                                    *ngFor="let member of availableMembers"
                                    (click)="toggleMember(member.id)"
                                    class="p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 select-none font-kantumruy"
                                    [ngClass]="isMemberSelected(member.id)
                                        ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 opacity-75 hover:opacity-100'"
                                >
                                    <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[12px] font-medium">
                                        {{ member.name.slice(0, 1) }}
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <p class="text-[16px] font-normal truncate leading-tight">{{ member.name }}</p>
                                        <p class="text-[13px] text-slate-400 truncate mt-0.5">{{ member.role }}</p>
                                    </div>
                                    <mat-icon
                                        [svgIcon]="isMemberSelected(member.id) ? 'mdi:check-circle' : 'mdi:circle-outline'"
                                        class="icon-size-4 text-purple-600 shrink-0"
                                    ></mat-icon>
                                </div>
                            </div>
                        </div>

                        <!-- Agenda -->
                        <div>
                            <label class="block font-normal text-slate-800 dark:text-slate-200 mb-2 text-[16px]">
                                របៀបវារៈ ឬ កំណត់ចំណាំខ្លឹមសារប្រជុំ
                            </label>
                            <textarea
                                rows="3"
                                [(ngModel)]="formAgenda"
                                placeholder="១. ត្រួតពិនិត្យការងារសប្តាហ៍មុន&#10;២. ផែនការអនុវត្តសប្តាហ៍ថ្មី"
                                class="w-full p-3 text-[16px] font-normal font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            ></textarea>
                        </div>

                    </div>

                </div>

                <!-- ----------------------------------------------------- -->
                <!-- VIEW 2: INSTANT ROOM                                  -->
                <!-- ----------------------------------------------------- -->
                <div *ngIf="activeTab() === 'instant' && !inCall()" class="p-5 space-y-6 font-kantumruy text-[16px]">
                    <div class="p-6 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/60 via-slate-50 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 text-center space-y-4">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <mat-icon svgIcon="mdi:video-vintage" class="icon-size-9"></mat-icon>
                        </div>
                        <div>
                            <h3 class="text-[18px] font-medium text-slate-900 dark:text-white">
                                បើកបន្ទប់ប្រជុំវីដេអូភ្លាមៗ (Instant Room)
                            </h3>
                            <p class="text-[15px] text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
                                ចាប់ផ្តើមបន្ទប់ពិភាក្សាផ្ទាល់ ជាមួយកាមេរ៉ា សំឡេង និងចែករំលែកអេក្រង់ភ្លាមៗ
                            </p>
                        </div>

                        <button
                            type="button"
                            (click)="startInstantMeetingDirectly()"
                            class="w-full h-12 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md cursor-pointer"
                        >
                            <mat-icon svgIcon="mdi:video" class="icon-size-5 text-white"></mat-icon>
                            <span>ចាប់ផ្តើមការប្រជុំឥឡូវនេះ</span>
                        </button>
                    </div>

                    <!-- Join By Code -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-3 font-kantumruy">
                        <h4 class="text-[16px] font-normal text-slate-800 dark:text-white flex items-center gap-2">
                            <mat-icon svgIcon="mdi:keyboard" class="icon-size-4.5 text-purple-600"></mat-icon>
                            <span>ចូលរួមតាមលេខកូដបន្ទប់</span>
                        </h4>
                        <div class="flex items-center gap-2.5">
                            <input
                                type="text"
                                [(ngModel)]="joinInputCode"
                                placeholder="លេខកូដបន្ទប់ (ឧ. meet-wms-2026)..."
                                class="flex-1 px-3.5 py-2.5 text-[15px] font-kantumruy rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                            <button
                                type="button"
                                (click)="joinByCode()"
                                [disabled]="!joinInputCode.trim()"
                                class="px-5 py-2.5 rounded-xl border border-purple-600 text-purple-600 dark:text-purple-400 font-medium font-kantumruy text-[15px] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                            >
                                ចូលរួម
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ----------------------------------------------------- -->
                <!-- VIEW 3: SCHEDULE LIST                                 -->
                <!-- ----------------------------------------------------- -->
                <div *ngIf="activeTab() === 'schedule' && !inCall()" class="p-5 space-y-4 font-kantumruy text-[16px]">
                    <div class="flex items-center justify-between">
                        <h3 class="text-[16px] font-normal text-slate-800 dark:text-white">
                            កាលវិភាគអង្គប្រជុំ ({{ scheduledMeetings().length }})
                        </h3>
                        <button
                            type="button"
                            (click)="activeTab.set('create')"
                            class="text-[15px] text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer font-kantumruy"
                        >
                            + បង្កើតថ្មី
                        </button>
                    </div>

                    <div *ngFor="let meeting of scheduledMeetings()"
                        class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-purple-400/60 transition-all space-y-3 font-kantumruy">
                        <div class="flex items-start justify-between gap-2.5">
                            <div class="flex items-start gap-2.5 min-w-0">
                                <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                    [ngClass]="meeting.status === 'live'
                                        ? 'bg-red-500/10 text-red-600 border border-red-500/30'
                                        : 'bg-purple-500/10 text-purple-600 border border-purple-500/30'">
                                    <mat-icon [svgIcon]="meeting.status === 'live' ? 'mdi:video-wireless' : 'mdi:calendar-check'" class="icon-size-5"></mat-icon>
                                </div>
                                <div class="min-w-0">
                                    <h4 class="text-[16px] font-medium text-slate-900 dark:text-white truncate">
                                        {{ meeting.title }}
                                    </h4>
                                    <p class="text-[13px] text-slate-400 mt-0.5">
                                        {{ meeting.time }} • {{ meeting.duration }}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                (click)="joinScheduledMeeting(meeting)"
                                class="px-3.5 py-1.5 rounded-lg text-[14px] font-medium font-kantumruy text-white bg-purple-600 hover:bg-purple-700 shrink-0 cursor-pointer"
                            >
                                ចូលរួម
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ----------------------------------------------------- -->
                <!-- VIEW 4: LIVE VIDEO CALL                               -->
                <!-- ----------------------------------------------------- -->
                <div *ngIf="inCall()" class="p-4 space-y-3 font-kantumruy text-[16px]">
                    <div class="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-[14px]">
                        <span class="flex items-center gap-1.5 text-red-400 font-medium">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span>កំពុងប្រជុំ • {{ formattedCallDuration }}</span>
                        </span>
                        <span class="text-slate-400 text-[13px]">បន្ទប់៖ {{ activeRoomCode() }}</span>
                    </div>

                    <!-- Video Grid -->
                    <div class="grid grid-cols-1 gap-2.5">
                        <div class="relative h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                            <div *ngIf="cameraOff()" class="text-center">
                                <div class="w-16 h-16 rounded-full bg-purple-600 text-white text-2xl font-medium flex items-center justify-center mx-auto">
                                    {{ data?.user?.kh_name?.slice(0, 1) || 'ច' }}
                                </div>
                                <p class="text-[13px] text-slate-400 mt-2">កាមេរ៉ាត្រូវបានបិទ</p>
                            </div>
                            <div *ngIf="!cameraOff()" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-950/40">
                                <mat-icon svgIcon="mdi:account" class="icon-size-16 text-purple-300"></mat-icon>
                            </div>
                            <div class="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-black/60 text-white text-[13px] flex items-center gap-1.5 font-kantumruy">
                                <span>{{ data?.user?.kh_name || 'ចេង ច័ន្ទបញ្ញា' }} (អ្នក)</span>
                                <mat-icon [svgIcon]="micMuted() ? 'mdi:microphone-off' : 'mdi:microphone'"
                                    class="icon-size-3.5"
                                    [ngClass]="micMuted() ? 'text-red-400' : 'text-emerald-400'"></mat-icon>
                            </div>
                        </div>

                        <div class="relative h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950/40">
                                <div class="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-200 text-xl font-medium">
                                    ស
                                </div>
                            </div>
                            <div class="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-black/60 text-white text-[13px] font-kantumruy">
                                សុខ សុភា (ប្រធានផ្នែក)
                            </div>
                        </div>
                    </div>

                    <!-- In-Call Control Bar -->
                    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            (click)="micMuted.set(!micMuted())"
                            class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                            [ngClass]="micMuted() ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200'"
                        >
                            <mat-icon [svgIcon]="micMuted() ? 'mdi:microphone-off' : 'mdi:microphone'" class="icon-size-5"></mat-icon>
                        </button>
                        <button
                            type="button"
                            (click)="cameraOff.set(!cameraOff())"
                            class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                            [ngClass]="cameraOff() ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-200'"
                        >
                            <mat-icon [svgIcon]="cameraOff() ? 'mdi:video-off' : 'mdi:video'" class="icon-size-5"></mat-icon>
                        </button>
                        <button
                            type="button"
                            (click)="leaveCall()"
                            class="px-4 h-10 rounded-full bg-red-600 text-white text-[14px] font-medium font-kantumruy flex items-center gap-1.5 cursor-pointer"
                        >
                            <mat-icon svgIcon="mdi:phone-hangup" class="icon-size-4.5"></mat-icon>
                            <span>ចាកចេញ</span>
                        </button>
                    </div>
                </div>

            </mat-dialog-content>

            <!-- ========================================================= -->
            <!-- 4. DIALOG FOOTER (Exact Side Drawer Footer Style)         -->
            <!-- ========================================================= -->
            <div *ngIf="!inCall() && activeTab() === 'create'" class="w-full flex items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-kantumruy">
                <button
                    type="button"
                    (click)="saveMeeting()"
                    class="w-full h-11 px-4 rounded-xl font-medium font-kantumruy text-[16px] flex items-center justify-center gap-2 text-white bg-[#1c2b6b] hover:bg-[#152254] transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                    <mat-icon svgIcon="mdi:plus" class="!w-5 !h-5 !text-white shrink-0"></mat-icon>
                    <span>បង្កើតអង្គប្រជុំ</span>
                </button>
            </div>

        </div>
    `,
})
export class CreateMeetingDialogComponent implements OnInit, OnDestroy {
    activeTab = signal<'create' | 'instant' | 'schedule'>('create');

    // Call state
    inCall = signal<boolean>(false);
    activeRoomCode = signal<string>('meet-wms-2026');
    activeRoomUrl = signal<string>('https://meet.wms.gov.kh/room/meet-wms-2026');
    micMuted = signal<boolean>(false);
    cameraOff = signal<boolean>(false);
    callSeconds = signal<number>(0);
    callTimer: any = null;

    copied = signal<boolean>(false);
    successMessage = signal<string>('');

    // Form inputs
    formTitle: string = '';
    formPlatform = signal<'wms' | 'google' | 'zoom'>('wms');
    formDate: string = new Date().toISOString().split('T')[0];
    formTime: string = '09:30';
    formDuration: string = '45 នាទី';
    formAgenda: string = '';
    generatedRoomCode: string = '';
    generatedRoomUrl: string = '';
    joinInputCode: string = '';

    availableMembers = [
        { id: '1', name: 'សុខ សុភា', role: 'ប្រធានគម្រោង' },
        { id: '2', name: 'រ័ត្ន វិចិត្រ', role: 'Frontend' },
        { id: '3', name: 'កែវ សុវណ្ណ', role: 'Backend' },
        { id: '4', name: 'ហេង ស្រីពៅ', role: 'UI/UX' },
    ];
    selectedMemberIds = signal<string[]>(['1', '2']);

    scheduledMeetings = signal<ScheduledMeeting[]>([
        {
            id: 'm1',
            title: 'ប្រជុំពិនិត្យវឌ្ឍនភាពការងារគម្រោង (Sprint Review)',
            type: 'wms',
            date: '០១ កញ្ញា ២០២៦ (ថ្ងៃនេះ)',
            time: '០៩:០០ ព្រឹក - ១០:០០ ព្រឹក',
            duration: '១ ម៉ោង',
            roomCode: 'meet-sprint-8821',
            roomUrl: 'https://meet.wms.gov.kh/room/meet-sprint-8821',
            organizer: 'សុខ សុភា',
            status: 'live',
            participants: [{ name: 'សុខ សុភា' }, { name: 'ចេង ច័ន្ទបញ្ញា' }],
        },
        {
            id: 'm2',
            title: 'ប្រជុំរៀបចំស្ថាបត្យកម្មប្រព័ន្ធ PMS',
            type: 'wms',
            date: '០១ កញ្ញា ២០២៦ (ថ្ងៃនេះ)',
            time: '០២:៣០ រសៀល - ០៣:៣០ រសៀល',
            duration: '១ ម៉ោង',
            roomCode: 'meet-arch-5542',
            roomUrl: 'https://meet.wms.gov.kh/room/meet-arch-5542',
            organizer: 'កែវ សុវណ្ណ',
            status: 'upcoming',
            participants: [{ name: 'កែវ សុវណ្ណ' }],
        },
    ]);

    constructor(
        public dialogRef: MatDialogRef<CreateMeetingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CreateMeetingDialogData,
        private readonly _homeService: UserHomeService,
    ) {
        this.generateNewRoomCode();
    }

    ngOnInit(): void {
        this._homeService.getMeetings().subscribe({
            next: (res) => {
                if (res?.data && res.data.length > 0) {
                    this.scheduledMeetings.set(res.data as ScheduledMeeting[]);
                }
            },
            error: (err) => console.error('Failed to load live meetings', err),
        });
    }

    ngOnDestroy(): void {
        this.stopCallTimer();
    }

    generateNewRoomCode(): void {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.generatedRoomCode = `meet-wms-${rand}`;
        this.generatedRoomUrl = `https://meet.wms.gov.kh/room/${this.generatedRoomCode}`;
    }

    isMemberSelected(id: string): boolean {
        return this.selectedMemberIds().includes(id);
    }

    toggleMember(id: string): void {
        const current = this.selectedMemberIds();
        if (current.includes(id)) {
            this.selectedMemberIds.set(current.filter((m) => m !== id));
        } else {
            this.selectedMemberIds.set([...current, id]);
        }
    }

    async copyLink(url: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2500);
        } catch {
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2500);
        }
    }

    saveMeeting(): void {
        if (!this.formTitle || !this.formTitle.trim()) {
            this.formTitle = 'កិច្ចប្រជុំពិភាក្សាការងារ';
        }

        const newMeeting: ScheduledMeeting = {
            id: 'm_' + Date.now(),
            title: this.formTitle.trim(),
            type: this.formPlatform(),
            date: this.formDate,
            time: this.formTime,
            duration: this.formDuration,
            roomCode: this.generatedRoomCode,
            roomUrl: this.generatedRoomUrl,
            organizer: this.data?.user?.kh_name || 'ចេង ច័ន្ទបញ្ញា',
            status: 'upcoming',
            participants: [{ name: this.data?.user?.kh_name || 'ចេង ច័ន្ទបញ្ញា' }],
            agenda: this.formAgenda.trim(),
        };

        this._homeService.createMeeting(newMeeting).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.scheduledMeetings.update((m) => [res.data, ...m]);
                } else {
                    this.scheduledMeetings.update((m) => [newMeeting, ...m]);
                }
            },
            error: () => {
                this.scheduledMeetings.update((m) => [newMeeting, ...m]);
            },
        });

        this.successMessage.set(`បានបង្កើតអង្គប្រជុំ «${newMeeting.title}» ដោយជោគជ័យ!`);
        this.formTitle = '';
        this.formAgenda = '';
        this.generateNewRoomCode();
        this.activeTab.set('schedule');

        setTimeout(() => this.successMessage.set(''), 4000);
    }

    startInstantMeetingDirectly(): void {
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.activeRoomCode.set(`meet-wms-instant-${rand}`);
        this.activeRoomUrl.set(`https://meet.wms.gov.kh/room/meet-wms-instant-${rand}`);
        this.inCall.set(true);
        this.startCallTimer();
    }

    joinScheduledMeeting(meeting: ScheduledMeeting): void {
        this.activeRoomCode.set(meeting.roomCode);
        this.activeRoomUrl.set(meeting.roomUrl);
        this.inCall.set(true);
        this.startCallTimer();
    }

    joinByCode(): void {
        if (!this.joinInputCode.trim()) return;
        const code = this.joinInputCode.trim();
        this.activeRoomCode.set(code);
        this.activeRoomUrl.set(`https://meet.wms.gov.kh/room/${code}`);
        this.inCall.set(true);
        this.startCallTimer();
    }

    startCallTimer(): void {
        this.stopCallTimer();
        this.callSeconds.set(0);
        this.callTimer = setInterval(() => {
            this.callSeconds.update((s) => s + 1);
        }, 1000);
    }

    stopCallTimer(): void {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
    }

    leaveCall(): void {
        this.stopCallTimer();
        this.inCall.set(false);
    }

    get formattedCallDuration(): string {
        const total = this.callSeconds();
        const mins = Math.floor(total / 60);
        const secs = total % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    close(): void {
        this.stopCallTimer();
        this.dialogRef.close();
    }
}
