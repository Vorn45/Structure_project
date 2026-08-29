/** How a participant answered the meeting broadcast in Telegram. */
export enum MeetingRsvpResponse {
    /** បញ្ជាក់ — will attend. */
    CONFIRMED = 'confirmed',
    /** សុំច្បាប់ — asking to be excused. */
    PERMISSION = 'permission',
    /** បដិសេធ — will not attend. */
    REJECTED = 'rejected',
}
