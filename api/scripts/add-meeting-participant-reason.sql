BEGIN;

ALTER TABLE meeting.meeting_participant
    ADD COLUMN IF NOT EXISTS reason varchar(500);

COMMENT ON COLUMN meeting.meeting_participant.reason IS
    'Why the participant declined; set alongside a ''rejected'' response, cleared on any other.';

COMMIT;
