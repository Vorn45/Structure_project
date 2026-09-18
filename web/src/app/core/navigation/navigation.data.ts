import { HelperNavigationItem } from 'helper/components/navigation';

// `title` holds a transloco translation key here, not display text —
// NavigationService resolves it into the actual title on every emission.
const superAdminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Navigation.Dashboard',
        type: 'basic',
        icon: 'mdi:view-grid-outline',
        link: '/admin/dashboard',
    },
    {
        id: 'planner',
        title: 'Navigation.Planner',
        type: 'basic',
        icon: 'mdi:calendar-month-outline',
        link: '/admin/planner',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:file-document-outline',
        link: '/admin/projects',
    },
    {
        id: 'users',
        title: 'Navigation.User',
        type: 'basic',
        icon: 'mdi:account-plus-outline',
        link: '/admin/users',
    },
    {
        id: 'clients',
        title: 'Navigation.Clients',
        type: 'basic',
        icon: 'mdi:account-multiple-outline',
        link: '/admin/clients',
    },
    {
        id: 'attendance',
        title: 'Navigation.Attendance',
        type: 'basic',
        icon: 'mdi:calendar-check-outline',
        link: '/admin/attendance',
    },
    {
        id: 'settings',
        title: 'Navigation.Settings',
        type: 'basic',
        icon: 'mdi:key-outline',
        link: '/admin/settings',
    },
];

const orgAdminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Navigation.Dashboard',
        type: 'basic',
        icon: 'mdi:view-grid-outline',
        link: '/admin/dashboard',
    },
    {
        id: 'planner',
        title: 'Navigation.Planner',
        type: 'basic',
        icon: 'mdi:calendar-month-outline',
        link: '/admin/planner',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:file-document-outline',
        link: '/admin/projects',
    },
    {
        id: 'staff',
        title: 'Navigation.Staff',
        type: 'basic',
        icon: 'mdi:account-plus-outline',
        link: '/admin/staff',
    },
    {
        id: 'clients',
        title: 'Navigation.Clients',
        type: 'basic',
        icon: 'mdi:account-multiple-outline',
        link: '/admin/clients',
    },
    {
        id: 'attendance',
        title: 'Navigation.Attendance',
        type: 'basic',
        icon: 'mdi:calendar-check-outline',
        link: '/admin/attendance',
    },
    {
        id: 'organization',
        title: 'Navigation.Organization',
        type: 'basic',
        icon: 'mdi:key-outline',
        link: '/admin/organization',
    },
];

const adminNavigation: HelperNavigationItem[] = superAdminNavigation;

const memberNavigation: HelperNavigationItem[] = [
    {
        id: 'home',
        title: 'Navigation.Home',
        type: 'basic',
        icon: 'mdi:home',
        link: '/member/home',
    },
    {
        id: 'planner',
        title: 'Navigation.Planner',
        type: 'basic',
        icon: 'mdi:calendar-month-outline',
        link: '/member/planner',
    },
    {
        id: 'tasks',
        title: 'Navigation.Tasks',
        type: 'basic',
        icon: 'mdi:format-list-checks',
        link: '/member/tasks',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:file-document-outline',
        link: '/member/projects',
    },
    {
        id: 'report',
        title: 'Navigation.Report',
        type: 'basic',
        icon: 'mdi:clipboard-text-outline',
        link: '/member/report',
    },
];



const personalWorkspaceNavigation: HelperNavigationItem[] = [
    {
        id: 'home',
        title: 'Navigation.Home',
        type: 'basic',
        icon: 'mdi:home',
        link: '/member/home',
    },
    {
        id: 'planner',
        title: 'Navigation.Planner',
        type: 'basic',
        icon: 'mdi:calendar-month-outline',
        link: '/member/planner',
    },
    {
        id: 'tasks',
        title: 'Navigation.Tasks',
        type: 'basic',
        icon: 'mdi:format-list-checks',
        link: '/member/tasks',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:file-document-outline',
        link: '/member/projects',
    },
    {
        id: 'report',
        title: 'Navigation.Report',
        type: 'basic',
        icon: 'mdi:clipboard-text-outline',
        link: '/member/report',
    },
];

export const navigationData = {
    admin: adminNavigation,
    superAdmin: superAdminNavigation,
    orgAdmin: orgAdminNavigation,
    member: memberNavigation,
    personalWorkspace: personalWorkspaceNavigation,
};
