export enum OrganizationPosition {
    TECHNICAL_OFFICER = 'technical_officer',
    TECHNICAL_ADVISOR = 'technical_advisor',
    OFFICER = 'officer',
    MINISTRY_ASSISTANT = 'ministry_assistant',
    GENERAL_MANAGER = 'general_manager',
}

export const ORGANIZATION_POSITION = {
    TECHNICAL_OFFICER: 1,
    TECHNICAL_ADVISOR: 2,
    OFFICER: 3,
    MINISTRY_ASSISTANT: 4,
    GENERAL_MANAGER: 5,
};

export const ORGANIZATION_POSITION_VALUE: Record<
    OrganizationPosition,
    number
> = {
    [OrganizationPosition.TECHNICAL_OFFICER]:
        ORGANIZATION_POSITION.TECHNICAL_OFFICER,
    [OrganizationPosition.TECHNICAL_ADVISOR]:
        ORGANIZATION_POSITION.TECHNICAL_ADVISOR,
    [OrganizationPosition.OFFICER]: ORGANIZATION_POSITION.OFFICER,
    [OrganizationPosition.MINISTRY_ASSISTANT]:
        ORGANIZATION_POSITION.MINISTRY_ASSISTANT,
    [OrganizationPosition.GENERAL_MANAGER]:
        ORGANIZATION_POSITION.GENERAL_MANAGER,
};

export const ORGANIZATION_POSITION_NAME: Record<
    number,
    { name_kh: string; name_en: string }
> = {
    [ORGANIZATION_POSITION.TECHNICAL_OFFICER]: {
        name_kh: 'មន្ត្រីបច្ចេកទេស',
        name_en: 'Technical Officer',
    },
    [ORGANIZATION_POSITION.TECHNICAL_ADVISOR]: {
        name_kh: 'ទីប្រឹក្សាបច្ចេកទេស',
        name_en: 'Technical advisor',
    },
    [ORGANIZATION_POSITION.OFFICER]: {
        name_kh: 'មន្ត្រី',
        name_en: 'Officer',
    },
    [ORGANIZATION_POSITION.MINISTRY_ASSISTANT]: {
        name_kh: 'ជំនួយការក្រសួង',
        name_en: 'Ministry assistant',
    },
    [ORGANIZATION_POSITION.GENERAL_MANAGER]: {
        name_kh: 'អ្នកគ្រប់គ្រងទូទៅ',
        name_en: 'General Manager',
    },
};

export const ORGANIZATION_ADMIN_POSITION_NAMES = [
    'Technical Officer',
    'Technical advisor',
    'General Manager',
];
