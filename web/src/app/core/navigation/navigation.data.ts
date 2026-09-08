import { HelperNavigationItem } from 'helper/components/navigation';

// `title` holds a transloco translation key here, not display text —
// NavigationService resolves it into the actual title on every emission.
const adminNavigation: HelperNavigationItem[] = [
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
        id: 'financials',
        title: 'Navigation.Financials',
        type: 'basic',
        icon: 'mdi:bank-outline',
        link: '/admin/financials',
    },
    {
        id: 'reports',
        title: 'Navigation.Reports',
        type: 'basic',
        icon: 'mdi:clipboard-text-outline',
        link: '/admin/reports',
    },
    {
        id: 'admin',
        title: 'Navigation.Admin',
        type: 'basic',
        icon: 'mdi:key-outline',
        link: '/admin/admin',
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
        id: 'financials',
        title: 'Navigation.Financials',
        type: 'basic',
        icon: 'mdi:bank-outline',
        link: '/admin/financials',
    },
    {
        id: 'reports',
        title: 'Navigation.Reports',
        type: 'basic',
        icon: 'mdi:clipboard-text-outline',
        link: '/admin/reports',
    },
    {
        id: 'admin',
        title: 'Navigation.Admin',
        type: 'basic',
        icon: 'mdi:key-outline',
        link: '/admin/admin',
    },
];

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
    orgAdmin: orgAdminNavigation,
    member: memberNavigation,
    personalWorkspace: personalWorkspaceNavigation,
};
