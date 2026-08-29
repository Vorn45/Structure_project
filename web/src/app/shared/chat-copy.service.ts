import { Injectable, NgZone } from '@angular/core';
import { SnackbarService }     from 'helper/services/snack-bar/snack-bar.service';

/**
 * Telegram-style "copy text" for every chat surface in the app (task chat panel,
 * project message dialog). Two jobs:
 *
 *  1. Write text to the clipboard, with an `execCommand` fallback for browsers
 *     or contexts where the async clipboard is unavailable/denied, and a snackbar
 *     either way so the user knows it landed.
 *  2. Remember the last highlighted range so "copy" can copy just the selection
 *     when the user has highlighted part of a message — by the time the menu item
 *     is clicked the click itself has already cleared the live selection, so the
 *     snapshot has to be taken as the selection happens.
 *
 * Selections are attributed to a message by the nearest `[data-mid]` ancestor, so
 * a chat template only has to stamp that attribute on each message row (they
 * already do, for reply-jump scrolling) and pass the id in.
 */
@Injectable({ providedIn: 'root' })
export class ChatCopyService {
    private _snapshot: { mid: string; text: string } | null = null;

    constructor(private _snackbar: SnackbarService, zone: NgZone) {
        // Outside the zone: selectionchange fires on every caret move and only
        // touches a private field — no change detection needed.
        zone.runOutsideAngular(() => {
            document.addEventListener('selectionchange', () => this._captureSelection());
        });
    }

    /**
     * Copy `fullText`, or the user's highlight inside message `mid` when there is
     * one — the same choice Telegram makes between "copy text" and "copy selected".
     */
    copyMessage(mid: string | null | undefined, fullText: string): void {
        const partial = mid && this._snapshot?.mid === mid ? this._snapshot.text : '';
        this.copy(partial || fullText);
    }

    /**
     * Whether the user has text highlighted inside message `mid`. Lets a chat tell
     * a text-selecting gesture apart from a plain one — e.g. double-click is both
     * "reply" and the browser's select-a-word, and only one of them can win.
     */
    hasSelectionIn(mid: string | null | undefined): boolean {
        return !!mid && this._snapshot?.mid === mid;
    }

    copy(text: string): void {
        if (!text) return;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(
                () => this._settle(true),
                () => this._settle(this._legacyCopy(text)),   // denied permission / insecure context
            );
            return;
        }
        this._settle(this._legacyCopy(text));
    }

    private _settle(ok: boolean): void {
        ok
            ? this._snackbar.openSnackBar('បានចម្លងអត្ថបទ', 'primary')
            : this._snackbar.openSnackBar('ចម្លងអត្ថបទមិនបានទេ', 'error');
    }

    private _captureSelection(): void {
        const sel = window.getSelection();
        const mid = this._selectionMid(sel);
        const text = sel?.toString().trim() ?? '';
        if (text && mid) { this._snapshot = { mid, text }; return; }
        // Clicking inside the same message (collapsed caret) keeps the snapshot;
        // anything else — a click elsewhere, or a cross-message drag — drops it.
        if (mid !== this._snapshot?.mid) this._snapshot = null;
    }

    /** The message id both ends of `sel` sit in, or null when it spans/leaves messages. */
    private _selectionMid(sel: Selection | null): string | null {
        if (!sel || !sel.anchorNode) return null;
        const rowOf = (n: Node | null): Element | null => {
            const el = n && n.nodeType === Node.TEXT_NODE ? n.parentElement : (n as Element | null);
            return el?.closest?.('[data-mid]') ?? null;
        };
        const row = rowOf(sel.anchorNode);
        if (!row || row !== rowOf(sel.focusNode)) return null;
        return row.getAttribute('data-mid') || null;
    }

    /** `execCommand` fallback for browsers/contexts without the async clipboard. */
    private _legacyCopy(text: string): boolean {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }
}
