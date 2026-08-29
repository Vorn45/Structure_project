export enum ProjectPermissionKey {
    // Project-level (boolean: on/off, no per-task ownership concept)
    MANAGE_PROJECT_SETTINGS = 'manage_project_settings',
    DELETE_PROJECT = 'delete_project',
    MANAGE_PEOPLE = 'manage_people',
    CHANGE_MEMBER_ROLES = 'change_member_roles',

    // Task-level (scoped: ALL / OWNER / REPORTER_ONLY / NONE)
    VIEW_ALL_TASKS = 'view_all_tasks',
    EDIT_TASK_TITLE = 'edit_task_title',
    EDIT_TASK_DESCRIPTION = 'edit_task_description',
    EDIT_TASK_STATUS = 'edit_task_status',
    EDIT_TASK_TYPE = 'edit_task_type',
    EDIT_TASK_DUE_DATE = 'edit_task_due_date',
    EDIT_TASK_ASSIGNEE = 'edit_task_assignee',
    EDIT_TASK_PRIORITY = 'edit_task_priority',
    EDIT_TASK_ESTIMATED_TIME = 'edit_task_estimated_time',
    EDIT_TASK_REPORTER = 'edit_task_reporter',
    MANAGE_SUBTASKS = 'manage_subtasks',
    MANAGE_ATTACHMENTS = 'manage_attachments',
    MANAGE_TAGS = 'manage_tags',
    MANAGE_COMMENTS = 'manage_comments',
    MANAGE_FOLLOWERS = 'manage_followers',
}

// Project-level keys: plain on/off, no notion of "owner" for project-wide actions.
export const BOOLEAN_PERMISSION_KEYS = [
    ProjectPermissionKey.MANAGE_PROJECT_SETTINGS,
    ProjectPermissionKey.DELETE_PROJECT,
    ProjectPermissionKey.MANAGE_PEOPLE,
    ProjectPermissionKey.CHANGE_MEMBER_ROLES,
] as const;

// Task-level keys: resolved against a 4-value PermissionScope instead of a bare boolean.
export const SCOPED_PERMISSION_KEYS = [
    ProjectPermissionKey.VIEW_ALL_TASKS,
    ProjectPermissionKey.EDIT_TASK_TITLE,
    ProjectPermissionKey.EDIT_TASK_DESCRIPTION,
    ProjectPermissionKey.EDIT_TASK_STATUS,
    ProjectPermissionKey.EDIT_TASK_TYPE,
    ProjectPermissionKey.EDIT_TASK_DUE_DATE,
    ProjectPermissionKey.EDIT_TASK_ASSIGNEE,
    ProjectPermissionKey.EDIT_TASK_PRIORITY,
    ProjectPermissionKey.EDIT_TASK_ESTIMATED_TIME,
    ProjectPermissionKey.EDIT_TASK_REPORTER,
    ProjectPermissionKey.MANAGE_SUBTASKS,
    ProjectPermissionKey.MANAGE_ATTACHMENTS,
    ProjectPermissionKey.MANAGE_TAGS,
    ProjectPermissionKey.MANAGE_COMMENTS,
    ProjectPermissionKey.MANAGE_FOLLOWERS,
] as const;

export type BooleanPermissionKey = (typeof BOOLEAN_PERMISSION_KEYS)[number];
export type ScopedPermissionKey = (typeof SCOPED_PERMISSION_KEYS)[number];

export const PROJECT_PERMISSION_KEYS = Object.values(
    ProjectPermissionKey,
) as ProjectPermissionKey[];

// Shared 4-value scope, used both for task_delete_scope and for every
// scoped permission key ("Can this role edit/manage X?").
export enum PermissionScope {
    ALL = 'all', // Yes, for any task in the project
    OWNER = 'owner', // Yes, if they are the task assignee, creator, or reporter
    REPORTER_ONLY = 'reporter_only', // Only if they are the task creator or reporter
    NONE = 'none', // No, they can't
}

// Kept as an alias: task_delete_scope uses the same 4 values as the scoped
// permission keys above, just under its own historical name.
export const TaskDeleteScope = PermissionScope;
export type TaskDeleteScope = PermissionScope;

// Bilingual labels for the 4 PermissionScope values, shared by every scoped
// task_permissions key and task_delete_scope — the single source of truth
// so API responses (e.g. permission_setup) don't hardcode this text.
export const PERMISSION_SCOPE_LABELS: Record<
    PermissionScope,
    { name_en: string; name_kh: string }
> = {
    [PermissionScope.ALL]: {
        name_en: 'Yes, any task in the project',
        name_kh: 'បាទ/ចាស គ្រប់កិច្ចការទាំងអស់ក្នុងគម្រោង',
    },
    [PermissionScope.OWNER]: {
        name_en: 'Yes, if they are the task assignee, creator, or reporter',
        name_kh: 'បាទ/ចាស ប្រសិនបើពួកគេជាអ្នកទទួលបន្ទុក អ្នកបង្កើត ឬអ្នករាយការណ៍នៃកិច្ចការនោះ',
    },
    [PermissionScope.REPORTER_ONLY]: {
        name_en: 'Only if they are the task creator or reporter',
        name_kh: 'តែក្នុងករណីពួកគេជាអ្នកបង្កើត ឬអ្នករាយការណ៍នៃកិច្ចការនោះប៉ុណ្ណោះ',
    },
    [PermissionScope.NONE]: {
        name_en: 'No, they can’t',
        name_kh: 'ទេ ពួកគេមិនអាចធ្វើបានទេ',
    },
};

export type ProjectPermissionMap = Record<BooleanPermissionKey, boolean> &
    Record<ScopedPermissionKey, PermissionScope>;

export const DEFAULT_PROJECT_PERMISSIONS: ProjectPermissionMap = {
    ...BOOLEAN_PERMISSION_KEYS.reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as Record<BooleanPermissionKey, boolean>),
    ...SCOPED_PERMISSION_KEYS.reduce((acc, key) => {
        acc[key] = PermissionScope.NONE;
        return acc;
    }, {} as Record<ScopedPermissionKey, PermissionScope>),
};
