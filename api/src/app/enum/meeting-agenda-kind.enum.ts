export enum MeetingAgendaKind {
    /** What the meeting set out to do — planned before it happens. */
    OBJECTIVE = 'objective',
    /** What it actually produced — recorded after. */
    OUTCOME = 'outcome',
    /** What has to happen next, optionally assigned to people. */
    NEXT_STEP = 'next_step',
}
