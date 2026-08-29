BEGIN;

-- Keeps the selected preset icon separate from the uploaded fallback PNG.
-- The web app renders icon_key with text-primary, so it follows the active
-- organization/theme primary colour without changing the stored image.
ALTER TABLE organization.organization_type
    ADD COLUMN IF NOT EXISTS icon_key VARCHAR(100) NULL;

ALTER TABLE organization.organization_purpose
    ADD COLUMN IF NOT EXISTS icon_key VARCHAR(100) NULL;

COMMIT;
