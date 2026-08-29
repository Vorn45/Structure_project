BEGIN;

ALTER TABLE meeting.meeting
    ADD COLUMN IF NOT EXISTS leader_ids jsonb;

-- Preserve every existing meeting's organizer as its initial leader. This is
-- safe to rerun: populated leader lists are left unchanged.
UPDATE meeting.meeting
SET leader_ids = jsonb_build_array(organizer_id)
WHERE organizer_id IS NOT NULL
  AND (
      leader_ids IS NULL
      OR jsonb_typeof(leader_ids) <> 'array'
      OR jsonb_array_length(leader_ids) = 0
  );

COMMENT ON COLUMN meeting.meeting.leader_ids IS
    'Ordered user ids of meeting leaders; the first id mirrors organizer_id.';

COMMIT;
