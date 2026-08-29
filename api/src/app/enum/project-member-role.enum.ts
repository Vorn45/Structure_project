import {
    BOOLEAN_PERMISSION_KEYS,
    DEFAULT_PROJECT_PERMISSIONS,
    PermissionScope,
    ProjectPermissionKey,
    SCOPED_PERMISSION_KEYS,
    TaskDeleteScope,
} from './project-permission.enum';
import type { ProjectPermissionMap } from './project-permission.enum';

export enum ProjectMemberRole {
    PROJECT_LEAD = 'project_lead',
    UX_UI_DESIGNER = 'ux_ui_designer',
    FRONTEND_DEVELOPER = 'frontend_developer',
    BACKEND_DEVELOPER = 'backend_developer',
    FULLSTACK_DEVELOPER = 'fullstack_developer',
}

export const PROJECT_MEMBER_ROLE = {
    PROJECT_LEAD: 1,
    UX_UI_DESIGNER: 2,
    FRONTEND_DEVELOPER: 3,
    BACKEND_DEVELOPER: 4,
    FULLSTACK_DEVELOPER: 5,
};

export const PROJECT_MEMBER_ROLE_VALUE: Record<ProjectMemberRole, number> = {
    [ProjectMemberRole.PROJECT_LEAD]: PROJECT_MEMBER_ROLE.PROJECT_LEAD,
    [ProjectMemberRole.UX_UI_DESIGNER]: PROJECT_MEMBER_ROLE.UX_UI_DESIGNER,
    [ProjectMemberRole.FRONTEND_DEVELOPER]:
        PROJECT_MEMBER_ROLE.FRONTEND_DEVELOPER,
    [ProjectMemberRole.BACKEND_DEVELOPER]:
        PROJECT_MEMBER_ROLE.BACKEND_DEVELOPER,
    [ProjectMemberRole.FULLSTACK_DEVELOPER]:
        PROJECT_MEMBER_ROLE.FULLSTACK_DEVELOPER,
};

export const PROJECT_MEMBER_ROLE_NAME: Record<
    number,
    { name_kh: string; name_en: string }
> = {
    [PROJECT_MEMBER_ROLE.PROJECT_LEAD]: {
        name_kh: 'ប្រធានគម្រោង',
        name_en: 'Project lead',
    },
    [PROJECT_MEMBER_ROLE.UX_UI_DESIGNER]: {
        name_kh: 'អ្នករចនាប្រព័ន្ធឌីជីថល',
        name_en: 'UX/UI designer',
    },
    [PROJECT_MEMBER_ROLE.FRONTEND_DEVELOPER]: {
        name_kh: 'អ្នកអភិវឌ្ឍន៍ផ្នែកខាងមុខ',
        name_en: 'Frontend developer',
    },
    [PROJECT_MEMBER_ROLE.BACKEND_DEVELOPER]: {
        name_kh: 'អ្នកអភិវឌ្ឍន៍ផ្នែកខាងក្រោយ',
        name_en: 'Backend developer',
    },
    [PROJECT_MEMBER_ROLE.FULLSTACK_DEVELOPER]: {
        name_kh: 'អ្នកអភិវឌ្ឍន៍ពេញលេញ',
        name_en: 'Fullstack developer',
    },
};

const FULL_PROJECT_PERMISSIONS: ProjectPermissionMap = {
    ...BOOLEAN_PERMISSION_KEYS.reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {} as Record<(typeof BOOLEAN_PERMISSION_KEYS)[number], boolean>),
    ...SCOPED_PERMISSION_KEYS.reduce((acc, key) => {
        acc[key] = PermissionScope.ALL;
        return acc;
    }, {} as Record<(typeof SCOPED_PERMISSION_KEYS)[number], PermissionScope>),
};

// Full task-level access (every scoped key = ALL), but no project-settings/
// people/role-management access (project-level keys stay false).
const TASK_MEMBER_PERMISSIONS: ProjectPermissionMap = {
    ...DEFAULT_PROJECT_PERMISSIONS,
    [ProjectPermissionKey.VIEW_ALL_TASKS]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_TITLE]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_DESCRIPTION]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_STATUS]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_TYPE]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_DUE_DATE]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_ASSIGNEE]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_PRIORITY]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_ESTIMATED_TIME]: PermissionScope.ALL,
    [ProjectPermissionKey.EDIT_TASK_REPORTER]: PermissionScope.ALL,
    [ProjectPermissionKey.MANAGE_SUBTASKS]: PermissionScope.ALL,
    [ProjectPermissionKey.MANAGE_ATTACHMENTS]: PermissionScope.ALL,
    [ProjectPermissionKey.MANAGE_TAGS]: PermissionScope.ALL,
    [ProjectPermissionKey.MANAGE_COMMENTS]: PermissionScope.ALL,
    [ProjectPermissionKey.MANAGE_FOLLOWERS]: PermissionScope.ALL,
};

export const PROJECT_MEMBER_ROLE_DEFAULTS: Record<
    number,
    { permissions: ProjectPermissionMap; task_delete_scope: TaskDeleteScope }
> = {
    [PROJECT_MEMBER_ROLE.PROJECT_LEAD]: {
        permissions: FULL_PROJECT_PERMISSIONS,
        task_delete_scope: TaskDeleteScope.ALL,
    },
    [PROJECT_MEMBER_ROLE.UX_UI_DESIGNER]: {
        permissions: TASK_MEMBER_PERMISSIONS,
        task_delete_scope: TaskDeleteScope.OWNER,
    },
    [PROJECT_MEMBER_ROLE.FRONTEND_DEVELOPER]: {
        permissions: TASK_MEMBER_PERMISSIONS,
        task_delete_scope: TaskDeleteScope.OWNER,
    },
    [PROJECT_MEMBER_ROLE.BACKEND_DEVELOPER]: {
        permissions: TASK_MEMBER_PERMISSIONS,
        task_delete_scope: TaskDeleteScope.OWNER,
    },
    [PROJECT_MEMBER_ROLE.FULLSTACK_DEVELOPER]: {
        permissions: TASK_MEMBER_PERMISSIONS,
        task_delete_scope: TaskDeleteScope.OWNER,
    },
};
