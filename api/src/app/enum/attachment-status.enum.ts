/**
 * Triage state of an uploaded file. Attachments start untagged (null) — the tag
 * is something a person puts on, not a default. A tagged task chat attachment is
 * also mirrored into the task's own attachment list, so the detail view carries
 * the files that raised or settled something.
 */
export enum AttachmentStatus {
    PROBLEM = 'problem',
    RESOLVED = 'resolved',
}
