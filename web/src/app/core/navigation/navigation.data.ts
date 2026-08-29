import { HelperNavigationItem } from 'helper/components/navigation';

// `title` holds a transloco translation key here, not display text —
// NavigationService resolves it into the actual title on every emission.
const adminNavigation: HelperNavigationItem[] = [
    {
        id: 'home',
        title: 'Navigation.Home',
        type: 'basic',
        icon: 'mdi:home',
        link: '/super-admin/home',
    },
    {
        id: 'invoice',
        title: 'Navigation.Invoice',
        type: 'basic',
        icon: 'mdi:invoice-list',
        link: '/super-admin/invoice',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:star',
        link: '/super-admin/projects',
    },
    {
        id: 'organization',
        title: 'Navigation.Organization',
        type: 'basic',
        icon: 'heroicons--building-office-2-solid',
        link: '/super-admin/organization',
    },
    {
        id: 'package',
        title: 'Navigation.Package',
        type: 'basic',
        icon: 'mdi:gift',
        link: '/super-admin/package',
    },
    {
        id: 'users',
        title: 'Navigation.User',
        type: 'basic',
        icon: 'mdi:account-group',
        link: '/super-admin/user'
    },
    {
        id: 'settings',
        title: 'Navigation.Settings',
        type: 'basic',
        icon: 'mdi:cog',
        link: '/super-admin/settings',
    },

];

const orgAdminNavigation: HelperNavigationItem[] = [
    {
        id: 'home',
        title: 'Navigation.Home',
        type: 'basic',
        icon: 'mdi:home',
        link: '/org-admin/home',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:star',
        link: '/org-admin/projects',
    },
    {
        id: 'team',
        title: 'Navigation.Team',
        type: 'basic',
        icon: 'mdi:account-group',
        link: '/org-admin/team',
    },
    // {
    //     id: 'progress',
    //     title: 'វឌ្ឍនភាព',
    //     type: 'aside',
    //     icon: 'mdi:progress-check',
    //     children: [
    //         {
    //             id: 'progress.daily',
    //             title: 'ប្រចាំថ្ងៃ',
    //             type: 'basic',
    //             icon: 'mdi:calendar-today',
    //             link: '/org-admin/progress/daily',
    //         },
    //         {
    //             id: 'progress.weekly',
    //             title: 'ប្រចាំសប្ដាហ៍',
    //             type: 'basic',
    //             icon: 'mdi:calendar-week',
    //             link: '/org-admin/progress/weekly',
    //         },
    //         {
    //             id: 'progress.monthly',
    //             title: 'ប្រចាំខែ',
    //             type: 'basic',
    //             icon: 'mdi:calendar-blank',
    //             link: '/org-admin/progress/monthly',
    //         },
    //         {
    //             id: 'progress.quarterly',
    //             title: 'ប្រចាំត្រីមាស',
    //             type: 'basic',
    //             icon: 'mdi:calendar-range-outline',
    //             link: '/org-admin/progress/quarterly',
    //         },
    //         {
    //             id: 'progress.semester',
    //             title: 'ប្រចាំឆមាស',
    //             type: 'basic',
    //             icon: 'mdi:calendar-month',
    //             link: '/org-admin/progress/semester',
    //         },
    //         {
    //             id: 'progress.yearly',
    //             title: 'ប្រចាំឆ្នាំ',
    //             type: 'basic',
    //             icon: 'mdi:calendar-text',
    //             link: '/org-admin/progress/yearly',
    //         },
    //     ],
    // },
    {
        id: 'report',
        title: 'Navigation.Report',
        type: 'aside',
        icon: 'mdi:chart-box',
        children: [
            {
                id: 'report.general',
                title: 'Navigation.ReportGeneral',
                type: 'basic',
                icon: 'mdi:bar-chart',
                link: '/org-admin/report/general',
            },
            {
                id: 'report.task',
                title: 'Navigation.ReportTask',
                type: 'basic',
                icon: 'mdi:format-list-checks',
                link: '/org-admin/report/task',
            },
        ]
    },
    {
        id: 'organization',
        title: 'Navigation.Organization',
        type: 'basic',
        icon: 'heroicons--building-office-2-solid',
        link: '/org-admin/organization',
    },
];

const memberNavigation: HelperNavigationItem[] = [
    // {
    //     id: 'home',
    //     title: 'ទំព័រដើម',
    //     type: 'basic',
    //     icon: 'mdi:home',
    //     link: '/member/home',
    // },
    {
        id: 'tasks',
        title: 'Navigation.Tasks',
        type: 'basic',
        icon: 'mdi:format-list-checks',
        link: '/member/tasks',
    },
    {
        id: 'activity',
        title: 'Navigation.Activity',
        type: 'basic',
        icon: 'mdi:lightning-bolt',
        link: '/member/activity',
    },
    {
        id: 'projects',
        title: 'Navigation.Projects',
        type: 'basic',
        icon: 'mdi:star',
        link: '/member/projects',
    },
    {
        id: 'report',
        title: 'Navigation.Report',
        type: 'aside',
        icon: 'mdi:chart-box',
        children: [
            {
                id: 'report.general',
                title: 'Navigation.ReportGeneral',
                type: 'basic',
                icon: 'mdi:bar-chart',
                link: '/member/report/general',
            },
            {
                id: 'report.progress',
                title: 'Navigation.ReportProgress',
                type: 'basic',
                icon: 'mdi:progress-check',
                link: '/member/report/progress',
            },
            {
                id: 'report.productivity',
                title: 'Navigation.ReportProductivity',
                type: 'basic',
                icon: 'mdi:clock-check-outline',
                link: '/member/report/productivity',
            },
        ],
    },
];



const personalWorkspaceNavigation: HelperNavigationItem[] = [
    {
        id: 'tasks',
        title: 'Navigation.Tasks',
        type: 'basic',
        icon: 'mdi:format-list-checks',
        link: '/member/tasks',
        queryParams: { view: 'list' },
        exactMatch: true,
    },
    {
        id: 'kanban',
        title: 'Navigation.Kanban',
        type: 'basic',
        icon: 'mdi:chart-box',
        link: '/member/tasks',
        queryParams: { view: 'kanban' },
        exactMatch: true,
    },
    {
        id: 'calendar',
        title: 'Navigation.Calendar',
        type: 'basic',
        icon: 'mdi:calendar',
        link: '/member/tasks',
        queryParams: { view: 'calendar' },
        exactMatch: true,
    },
    {
        id: 'report',
        title: 'Navigation.Report',
        type: 'basic',
        icon: 'mdi:chart-box',
        link: '/member/report',
    },
];

export const navigationData = {
    admin: adminNavigation,
    orgAdmin: orgAdminNavigation,
    member: memberNavigation,
    personalWorkspace: personalWorkspaceNavigation,
};
