// ================================================================================>> Main Library
import { CommonModule }                  from '@angular/common';
import { Component }                     from '@angular/core';

// ================================================================================>> Third Party Library
import { MatButtonModule }               from '@angular/material/button';
import { MatDialogModule }               from '@angular/material/dialog';
import { MatIconModule }                 from '@angular/material/icon';
import { TranslocoModule }               from '@ngneat/transloco';

// ================================================================================>> Custom Library
import { SideDialogCloseButtonComponent } from 'app/shared/side-dialog-close-button/component';

// ======================================= >> Code Starts Here << ========================== //
interface ContactRow {
    /** Transloco key for the row's label. */
    label: string;
    /** Transloco key for the row's value, when the value is translatable text rather than raw data. */
    valueKey?: string;
    /** Raw value, for data that isn't language-specific (phone, email, url). */
    value?: string;
    icon: string;
    /** Set when the value is actionable — tel:, mailto: or a URL. */
    href?: string;
}

interface SocialLink {
    label: string;
    href: string;
    /** Brand colour; omitted for marks that follow the text colour instead. */
    colour?: string;
    /** Sprite icon id, for the marks the mdi set draws correctly. */
    icon?: string;
    /** Inline path, for marks the sprite has no current artwork for. */
    path?: string;
}

/** X's current mark; the mdi sprite still ships the old Twitter bird. */
const X_LOGO_PATH =
    'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z';

/**
 * Contact panel for the signed-out screens. Rendered as a side dialog, the
 * same shape the rest of the app uses, so the close button and panel chrome
 * come from the shared pieces rather than being reinvented here.
 *
 * The details are plain constants — edit this file to change them.
 */
@Component({
    selector   : 'auth-contact-dialog',
    standalone : true,
    templateUrl: './contact.component.html',
    imports    : [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        TranslocoModule,
        SideDialogCloseButtonComponent,
    ],
})
export class AuthContactDialogComponent {

    public readonly rows: ContactRow[] = [
        {
            label   : 'ContactDialog.AddressLabel',
            valueKey: 'ContactDialog.AddressValue',
            icon    : 'mdi:map-marker',
        },
        {
            label   : 'ContactDialog.WorkingHoursLabel',
            valueKey: 'ContactDialog.WorkingHoursValue',
            icon    : 'mdi:clock-time-four',
        },
        {
            label: 'ContactDialog.PhoneLabel',
            value: '+855 99 888 777',
            icon : 'mdi:phone',
            href : 'tel:+85599888777',
        },
        {
            label: 'ContactDialog.EmailLabel',
            value: 'info@nextask.com',
            icon : 'mdi:email',
            href : 'mailto:info@nextask.com',
        },
        {
            label: 'ContactDialog.WebsiteLabel',
            value: 'nextask.com',
            icon : 'mdi:web',
            href : 'https://nextask.com',
        },
    ];

    public readonly socials: SocialLink[] = [
        { label: 'YouTube',  icon: 'mdi:youtube',  href: 'https://www.youtube.com/',  colour: '#ff0000' },
        // No colour: the inline mark follows the text colour so it stays
        // visible in both schemes.
        { label: 'X',        path: X_LOGO_PATH,    href: 'https://x.com/' },
        { label: 'Facebook', icon: 'mdi:facebook', href: 'https://www.facebook.com/', colour: '#1877f2' },
        { label: 'Telegram', icon: 'mdi:telegram', href: 'https://t.me/',             colour: '#229ed9' },
    ];
}
