import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconsService {
    /**
     * Constructor
     */
    constructor() {
        const domSanitizer = inject(DomSanitizer);
        const matIconRegistry = inject(MatIconRegistry);

        // Register icon sets
        matIconRegistry.addSvgIcon(
            'baseline-person',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/baseline-person.svg',
            ),
        );
        matIconRegistry.addSvgIconInNamespace(
            'arcticons',
            'google-authenticator',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/arcticons--google-authenticator.svg',
            ),
        );
        // Boxicons pencil used by the profile drawer's edit button (mdi's pencil
        // reads lighter next to the 24px name).
        matIconRegistry.addSvgIconInNamespace(
            'bx',
            'edit-alt',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/bx--edit-alt.svg'),
        );
        matIconRegistry.addSvgIcon(
            'heroicons--building-office-2-solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons--building-office-2-solid.svg',
            ),
        );
        // Brand mark for pasted Canva links (mdi has Figma but no Canva).
        matIconRegistry.addSvgIcon(
            'canva',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/canva.svg'),
        );
        matIconRegistry.addSvgIcon(
            'people-search-amico',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/People search-amico.svg',
            ),
        );
        matIconRegistry.addSvgIconSet(
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-twotone.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-outline.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-solid.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'feather',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/feather.svg'),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-outline.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-solid.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_mini',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-mini.svg',
            ),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mdi',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/mdi.svg'),
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'logos',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/logos.svg'),
        );

        // Project setup wizard intro illustration — only the layers with a themed accent are
        // registered here; the rest stay plain <img> tags since they have no primary color.
        ['rocket', 'character', 'plant'].forEach((layer) => {
            matIconRegistry.addSvgIcon(
                `project-intro-${layer}`,
                domSanitizer.bypassSecurityTrustResourceUrl(
                    `images/illustrations/project-setup-intro/${layer}.svg`,
                ),
            );
        });

        // No-data illustrations (accent color uses currentColor so it follows text-primary)
        const noDataTypes = [
            'task', 'activity', 'milestone', 'project', 'team', 'org', 'chat',
            'mail', 'meeting', 'progress', 'invoice', 'file', 'tech', 'error',
            'meeting-purpose', 'meeting-result', 'meeting-next-task', 'phone-login',
        ];
        noDataTypes.forEach((type) => {
            matIconRegistry.addSvgIcon(
                `no-${type}`,
                domSanitizer.bypassSecurityTrustResourceUrl(
                    `images/apps/no-${type}.svg`,
                ),
            );
        });
        // No dedicated "no results" illustration exists yet — reuse the user
        // illustration so `<no-data-component type="search">` (used across
        // ~14 search/filter empty-states) doesn't render a broken image.
        matIconRegistry.addSvgIcon(
            'no-search',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'images/apps/no-user.svg',
            ),
        );
        // Filename doesn't follow the `no-{type}.svg` convention above.
        matIconRegistry.addSvgIcon(
            'no-task-priority',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'images/apps/notaskprority.svg',
            ),
        );
        // Local-passcode lock screen illustration (accent color uses currentColor so it follows text-primary)
        matIconRegistry.addSvgIcon(
            'lock-screen-illustration',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'images/apps/lock_screen.svg',
            ),
        );
        // Multicolor Google Authenticator logo
        matIconRegistry.addSvgIconLiteral(
            'google-authenticator-colored',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="none" stroke="#4285F4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M43.5 24a3.285 3.285 0 0 1-3.285 3.285H29.69L24 17.428l5.262-9.113a3.285 3.285 0 0 1 4.488-1.203h0a3.285 3.285 0 0 1 1.203 4.488l-5.262 9.115h10.524A3.285 3.285 0 0 1 43.5 24"/>
                    <path fill="none" stroke="#EA4335" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M33.75 40.888a3.285 3.285 0 0 1-4.488-1.202L24 30.572l-5.262 9.114a3.285 3.285 0 0 1-4.488 1.202h0a3.285 3.285 0 0 1-1.203-4.488l5.261-9.115H29.69l5.262 9.115a3.285 3.285 0 0 1-1.202 4.488"/>
                    <path fill="none" stroke="#34A853" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="m22.08 20.753l-3.771 6.532H7.785A3.285 3.285 0 0 1 4.5 24h0a3.285 3.285 0 0 1 3.285-3.285zm-3.771 6.532L24 17.428l5.691 9.857z"/>
                    <path fill="none" stroke="#FBBC05" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M24 17.428l-1.92 3.325l-3.771-.038l-5.262-9.115a3.285 3.285 0 0 1 1.203-4.488h0a3.285 3.285 0 0 1 4.488 1.202z"/>
                </svg>`,
            ),
        );

        // Multicolor Google "G" logo (inline so it renders in full color)
        matIconRegistry.addSvgIconLiteral(
            'google-colored',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                </svg>`,
            ),
        );

        // Multicolor Zoom logo (inline so it renders in full color)
        matIconRegistry.addSvgIconLiteral(
            'zoom-colored',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12.7143 -4.762 110.1906 28.572">
                    <path fill-rule="evenodd" fill="#2D8CFF" d="M69.012 5.712c.324.559.43 1.195.465 1.91l.046.953v6.664l.047.954c.094 1.558 1.243 2.71 2.813 2.808l.949.047V8.575l.047-.953c.039-.707.144-1.355.473-1.918a3.806 3.806 0 016.59.012c.324.559.425 1.207.464 1.906l.047.95v6.667l.047.954c.098 1.566 1.238 2.718 2.813 2.808l.949.047V7.622a7.62 7.62 0 00-7.617-7.62 7.6 7.6 0 00-5.715 2.581A7.61 7.61 0 0065.715.001c-1.582 0-3.05.48-4.266 1.309C60.707.482 59.047.001 58.094.001v19.047l.953-.047c1.594-.105 2.746-1.226 2.808-2.808l.051-.954V8.575l.047-.953c.04-.719.14-1.351.465-1.914a3.816 3.816 0 013.297-1.898 3.81 3.81 0 013.297 1.902zM3.809 19.002l.953.046h14.285l-.047-.95c-.129-1.566-1.238-2.71-2.809-2.812l-.953-.047h-8.57l11.426-11.43-.047-.949c-.074-1.582-1.23-2.725-2.809-2.812l-.953-.043L0 .001l.047.953c.125 1.551 1.25 2.719 2.808 2.809l.954.047h8.57L.953 15.24l.047.953c.094 1.57 1.227 2.707 2.809 2.808zM54.355 2.789a9.523 9.523 0 010 13.469 9.53 9.53 0 01-13.472 0c-3.719-3.719-3.719-9.75 0-13.469A9.518 9.518 0 0147.613 0a9.525 9.525 0 016.742 2.79zM51.66 5.486a5.717 5.717 0 010 8.082 5.717 5.717 0 01-8.082 0 5.717 5.717 0 010-8.082 5.717 5.717 0 018.082 0zM27.625 0a9.518 9.518 0 016.73 2.79c3.72 3.718 3.72 9.75 0 13.468a9.53 9.53 0 01-13.472 0c-3.719-3.719-3.719-9.75 0-13.469A9.518 9.518 0 0127.613 0zm4.035 5.484a5.717 5.717 0 010 8.083 5.717 5.717 0 01-8.082 0 5.717 5.717 0 010-8.082 5.717 5.717 0 018.082 0z"/>
                </svg>`,
            ),
        );

        // Multicolor Google Meet logo (inline so it renders in full color)
        matIconRegistry.addSvgIconLiteral(
            'google-meet-colored',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="-13.1265 -18 113.763 108">
                    <path fill="#00832d" d="M49.5 36l8.53 9.75 11.47 7.33 2-17.02-2-16.64-11.69 6.44z"/>
                    <path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z"/>
                    <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z"/>
                    <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z"/>
                    <path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z"/>
                    <path fill="#ffba00" d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z"/>
                </svg>`,
            ),
        );

        // Task Type Icons (Pixel-perfect matching design specification)
        matIconRegistry.addSvgIconLiteral(
            'task-type-feature',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-improvement',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="6 11 12 5 18 11"></polyline></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-bug',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 512 512" fill="currentColor"><path d="M256 0c53 0 96 43 96 96l0 3.6c0 15.7-12.7 28.4-28.4 28.4l-135.1 0c-15.7 0-28.4-12.7-28.4-28.4l0-3.6c0-53 43-96 96-96zM41.4 105.4c12.5-12.5 32.8-12.5 45.3 0l64 64c.7 .7 1.3 1.4 1.9 2.1c14.2-7.3 30.4-11.4 47.5-11.4l112 0c17.1 0 33.2 4.1 47.5 11.4c.6-.7 1.2-1.4 1.9-2.1l64-64c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3l-64 64c-.7 .7-1.4 1.3-2.1 1.9c6.2 12 10.1 25.3 11.1 39.5l64.3 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c0 24.6-5.5 47.8-15.4 68.6c2.2 1.3 4.2 2.9 6 4.8l64 64c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0l-63.1-63.1c-24.5 21.8-55.8 36.2-90.3 39.6L272 240c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 239.2c-34.5-3.4-65.8-17.8-90.3-39.6L86.6 502.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l64-64c1.9-1.9 3.9-3.4 6-4.8C101.5 367.8 96 344.6 96 320l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64.3 0c1.1-14.1 5-27.5 11.1-39.5c-.7-.6-1.4-1.2-2.1-1.9l-64-64c-12.5-12.5-12.5-32.8 0-45.3z"/></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-doc',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-research',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6.5 17.5l3.31-7.69L17.5 6.5l-3.31 7.69z"/></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-refactor',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg>`
            )
        );
        matIconRegistry.addSvgIconLiteral(
            'task-type-core',
            domSanitizer.bypassSecurityTrustHtml(
                `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2" fill="currentColor"></circle></svg>`
            )
        );
    }
}
