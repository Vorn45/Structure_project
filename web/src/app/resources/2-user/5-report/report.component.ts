import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    computed,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    signal,
    ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import * as echarts from 'echarts';
import { SelectProjectPlanDialogComponent } from '../3-activity/select-project-plan-dialog.component';

export interface ReportProjectItem {
    id: string;
    code: string;
    name: string;
}

export interface PeriodMetrics {
    velocity: number;
    completedTasks: number;
    activeTasks: number;
    pendingTasks: number;
    velocityNote: string;
    completedNote: string;
    activeNote: string;
    pendingNote: string;
    columnCategories: string[];
    columnData: number[];
    columnLabel: string;
    polarData: number[];
    teamCompleted: number[];
    teamActive: number[];
}

@Component({
    selector: 'user-report',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatDialogModule,
    ],
    templateUrl: './report.component.html',
})
export class UserReportComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('speedGaugeChart') speedGaugeRef!: ElementRef<HTMLDivElement>;
    @ViewChild('columnGradientChart') columnGradientRef!: ElementRef<HTMLDivElement>;
    @ViewChild('polarBarChart') polarBarRef!: ElementRef<HTMLDivElement>;
    @ViewChild('horizontalBarChart') horizontalBarRef!: ElementRef<HTMLDivElement>;

    private _charts: echarts.ECharts[] = [];

    // Active View Tab: 'statistics' (Primary Dashboard) | 'digest' (Letterhead)
    activeTab = signal<'statistics' | 'digest'>('statistics');

    // Period Filter: 'week' | 'month' | 'quarter'
    periodFilter = signal<'week' | 'month' | 'quarter'>('week');

    // Project Options
    projects: ReportProjectItem[] = [
        { id: '1', code: 'PMS-V2', name: 'ប្រព័ន្ធគ្រប់គ្រងគម្រោងបច្ចេកវិទ្យា (PMS)' },
        { id: '2', code: 'WMS-HR', name: 'ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងបុគ្គលិក (WMS)' },
        { id: '3', code: 'E-GOV', name: 'ប្រព័ន្ធច្រកចេញចូលតែមួយ (E-Gov Portal)' },
    ];
    selectedProjectId = signal<string>('1');

    currentProject = computed(() => {
        return this.projects.find((p) => p.id === this.selectedProjectId()) || this.projects[0];
    });

    // Dynamic Period-based Metrics Map
    private periodDataMap: Record<string, Record<'week' | 'month' | 'quarter', PeriodMetrics>> = {
        '1': {
            week: {
                velocity: 85,
                completedTasks: 4,
                activeTasks: 3,
                pendingTasks: 1,
                velocityNote: 'ដំណើរការលឿនតាម Sprint',
                completedNote: 'ក្នុងសប្តាហ៍នេះ',
                activeNote: 'ស្ថិតក្នុង Sprint 36',
                pendingNote: 'ត្រៀមធ្វើ Code Review',
                columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃនៃសប្តាហ៍នេះ',
                columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
                columnData: [1, 2, 0, 1, 0, 0],
                polarData: [85, 90, 75, 60, 70],
                teamCompleted: [1, 1, 0, 1, 1],
                teamActive: [0, 1, 1, 1, 0],
            },
            month: {
                velocity: 92,
                completedTasks: 16,
                activeTasks: 5,
                pendingTasks: 2,
                velocityNote: 'សម្រេចបាន ៩២% នៃផែនការខែ',
                completedNote: 'ក្នុងខែកញ្ញានេះ',
                activeNote: 'កំពុងអភិវឌ្ឍយ៉ាងសកម្ម',
                pendingNote: 'ត្រៀមធ្វើ UAT',
                columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍ក្នុងខែនេះ',
                columnCategories: ['សប្តាហ៍ទី ១', 'សប្តាហ៍ទី ២', 'សប្តាហ៍ទី ៣', 'សប្តាហ៍ទី ៤'],
                columnData: [3, 5, 4, 4],
                polarData: [92, 95, 88, 80, 85],
                teamCompleted: [3, 4, 3, 3, 3],
                teamActive: [1, 1, 1, 1, 1],
            },
            quarter: {
                velocity: 88,
                completedTasks: 48,
                activeTasks: 8,
                pendingTasks: 3,
                velocityNote: 'សម្រេចទាន់ពេលតាម Q3 Roadmap',
                completedNote: 'សរុបពេញត្រីមាស Q3',
                activeNote: 'ឆ្លងកាត់ ៣ Iterations',
                pendingNote: 'ត្រៀម Deploy Production',
                columnLabel: 'កិច្ចការសម្រេចប្រចាំខែក្នុងត្រីមាស Q3',
                columnCategories: ['កក្កដា', 'សីហា', 'កញ្ញា'],
                columnData: [14, 18, 16],
                polarData: [88, 92, 85, 78, 82],
                teamCompleted: [8, 12, 11, 14, 18],
                teamActive: [1, 4, 2, 3, 5],
            },
        },
        '2': {
            week: {
                velocity: 90,
                completedTasks: 3,
                activeTasks: 2,
                pendingTasks: 0,
                velocityNote: 'ដំណើរការទាន់ពេល ១០០%',
                completedNote: 'ក្នុងសប្តាហ៍នេះ',
                activeNote: 'ស្ថិតក្នុង Sprint 36',
                pendingNote: 'គ្មានកិច្ចការរង់ចាំ',
                columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃនៃសប្តាហ៍នេះ',
                columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
                columnData: [1, 0, 1, 1, 0, 0],
                polarData: [90, 85, 80, 70, 75],
                teamCompleted: [1, 1, 0, 1, 0],
                teamActive: [0, 1, 0, 1, 0],
            },
            month: {
                velocity: 94,
                completedTasks: 12,
                activeTasks: 3,
                pendingTasks: 1,
                velocityNote: 'ល្បឿនខ្ពស់ជាងផែនការដើម',
                completedNote: 'ក្នុងខែកញ្ញានេះ',
                activeNote: 'កំពុងធ្វើតេស្តស្កេនមុខ',
                pendingNote: 'រង់ចាំចុះហត្ថលេខា',
                columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍ក្នុងខែនេះ',
                columnCategories: ['សប្តាហ៍ទី ១', 'សប្តាហ៍ទី ២', 'សប្តាហ៍ទី ៣', 'សប្តាហ៍ទី ៤'],
                columnData: [2, 4, 3, 3],
                polarData: [94, 90, 85, 80, 82],
                teamCompleted: [2, 3, 3, 2, 2],
                teamActive: [1, 0, 1, 1, 0],
            },
            quarter: {
                velocity: 91,
                completedTasks: 36,
                activeTasks: 6,
                pendingTasks: 2,
                velocityNote: 'ត្រៀមបិទបញ្ចប់គម្រោង Q3',
                completedNote: 'សរុបពេញត្រីមាស Q3',
                activeNote: 'ឆ្លងកាត់ ២ Iterations',
                pendingNote: 'ត្រៀម Release v2.0',
                columnLabel: 'កិច្ចការសម្រេចប្រចាំខែក្នុងត្រីមាស Q3',
                columnCategories: ['កក្កដា', 'សីហា', 'កញ្ញា'],
                columnData: [10, 14, 12],
                polarData: [91, 88, 86, 75, 80],
                teamCompleted: [6, 9, 8, 10, 12],
                teamActive: [1, 2, 1, 2, 3],
            },
        },
        '3': {
            week: {
                velocity: 78,
                completedTasks: 2,
                activeTasks: 2,
                pendingTasks: 1,
                velocityNote: 'ដំណើរការសមរម្យ',
                completedNote: 'ក្នុងសប្តាហ៍នេះ',
                activeNote: 'ស្ថិតក្នុង Sprint 36',
                pendingNote: 'កំពុងដោះស្រាយ Bug',
                columnLabel: 'កិច្ចការសម្រេចតាមថ្ងៃនៃសប្តាហ៍នេះ',
                columnCategories: ['ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'],
                columnData: [0, 1, 0, 1, 0, 0],
                polarData: [75, 80, 70, 65, 68],
                teamCompleted: [0, 1, 0, 1, 0],
                teamActive: [1, 0, 1, 0, 0],
            },
            month: {
                velocity: 82,
                completedTasks: 8,
                activeTasks: 4,
                pendingTasks: 2,
                velocityNote: 'ដំណើរការតាមកាលវិភាគ',
                completedNote: 'ក្នុងខែកញ្ញានេះ',
                activeNote: 'កំពុងតភ្ជាប់ CamDigiKey',
                pendingNote: 'រង់ចាំ Approval',
                columnLabel: 'កិច្ចការសម្រេចតាមសប្តាហ៍ក្នុងខែនេះ',
                columnCategories: ['សប្តាហ៍ទី ១', 'សប្តាហ៍ទី ២', 'សប្តាហ៍ទី ៣', 'សប្តាហ៍ទី ៤'],
                columnData: [2, 2, 2, 2],
                polarData: [82, 85, 78, 72, 75],
                teamCompleted: [1, 2, 2, 2, 1],
                teamActive: [1, 1, 1, 1, 0],
            },
            quarter: {
                velocity: 80,
                completedTasks: 28,
                activeTasks: 6,
                pendingTasks: 3,
                velocityNote: 'ដំណើរការលើកាលវិភាគ Q3',
                completedNote: 'សរុបពេញត្រីមាស Q3',
                activeNote: 'ឆ្លងកាត់ ២ Iterations',
                pendingNote: 'ត្រៀម Pilot Run',
                columnLabel: 'កិច្ចការសម្រេចប្រចាំខែក្នុងត្រីមាស Q3',
                columnCategories: ['កក្កដា', 'សីហា', 'កញ្ញា'],
                columnData: [8, 11, 9],
                polarData: [80, 84, 76, 70, 72],
                teamCompleted: [5, 7, 6, 8, 9],
                teamActive: [1, 2, 1, 1, 2],
            },
        },
    };

    currentMetrics = computed(() => {
        const projId = this.selectedProjectId();
        const period = this.periodFilter();
        const projData = this.periodDataMap[projId] || this.periodDataMap['1'];
        return projData[period] || projData['week'];
    });

    constructor(
        private readonly _router: Router,
        private readonly _matDialog: MatDialog,
    ) {}

    openSelectProjectPlanDialog(activeTab: 'existing' | 'create' = 'existing'): void {
        const dialogRef = this._matDialog.open(SelectProjectPlanDialogComponent, {
            width: '620px',
            maxWidth: '95vw',
            data: {
                projects: this.projects,
                selectedProjectId: this.selectedProjectId(),
                activeTab,
            },
            autoFocus: false,
        });

        dialogRef.afterClosed().subscribe((res) => {
            if (res?.selectedProject) {
                this.selectedProjectId.set(res.selectedProject.id);
                this.updateChartsData();
            }
        });
    }

    setPeriod(period: 'week' | 'month' | 'quarter'): void {
        this.periodFilter.set(period);
        this.updateChartsData();
    }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.initCharts();
        }, 100);
    }

    ngOnDestroy(): void {
        this._charts.forEach((c) => c.dispose());
        this._charts = [];
    }

    @HostListener('window:resize')
    onResize(): void {
        this._charts.forEach((c) => c.resize());
    }

    onTabChange(tab: 'statistics' | 'digest'): void {
        this.activeTab.set(tab);
        if (tab === 'statistics') {
            setTimeout(() => {
                this.initCharts();
            }, 100);
        }
    }

    navigateHome(): void {
        this._router.navigate(['/member/home']);
    }

    navigateToProjects(): void {
        this._router.navigate(['/member/projects']);
    }

    printReport(): void {
        window.print();
    }

    exportReportCSV(): void {
        const headers = ['គម្រោង', 'ល្បឿន %', 'កិច្ចការបានបញ្ចប់', 'កិច្ចការកំពុងធ្វើ', 'កិច្ចការរង់ចាំ'];
        const row = [
            `"${this.currentProject().name}"`,
            `"${this.currentMetrics().velocity}%"`,
            `"${this.currentMetrics().completedTasks}"`,
            `"${this.currentMetrics().activeTasks}"`,
            `"${this.currentMetrics().pendingTasks}"`,
        ];

        const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `របាយការណ៍_${this.currentProject().code}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Initialize / Update all ECharts
    private initCharts(): void {
        this._charts.forEach((c) => c.dispose());
        this._charts = [];

        this.initSpeedGauge();
        this.initColumnGradientChart();
        this.initPolarBarChart();
        this.initHorizontalBarChart();
    }

    private updateChartsData(): void {
        this.initCharts();
    }

    // 1. Stage Speed Gauge (ECharts Speedometer Gauge)
    private initSpeedGauge(): void {
        if (!this.speedGaugeRef?.nativeElement) return;
        const chart = echarts.init(this.speedGaugeRef.nativeElement);
        this._charts.push(chart);

        const velocity = this.currentMetrics().velocity;

        const option: echarts.EChartsOption = {
            series: [
                {
                    type: 'gauge',
                    center: ['50%', '65%'],
                    radius: '90%',
                    startAngle: 200,
                    endAngle: -20,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    itemStyle: {
                        color: '#2563eb',
                    },
                    progress: {
                        show: true,
                        width: 18,
                    },
                    pointer: {
                        show: true,
                        length: '65%',
                        width: 5,
                        itemStyle: {
                            color: '#1e40af',
                        },
                    },
                    axisLine: {
                        lineStyle: {
                            width: 18,
                            color: [
                                [0.3, '#14b8a6'], // Teal
                                [0.7, '#3b82f6'], // Blue
                                [1, '#ef4444'],   // Red
                            ],
                        },
                    },
                    axisTick: {
                        distance: -24,
                        splitNumber: 5,
                        lineStyle: {
                            width: 1,
                            color: '#999',
                        },
                    },
                    splitLine: {
                        distance: -28,
                        length: 10,
                        lineStyle: {
                            width: 2,
                            color: '#999',
                        },
                    },
                    axisLabel: {
                        distance: -14,
                        color: '#64748b',
                        fontSize: 10,
                        fontFamily: 'Kantumruy Pro, sans-serif',
                    },
                    anchor: {
                        show: true,
                        showAbove: true,
                        size: 14,
                        itemStyle: {
                            borderWidth: 4,
                            borderColor: '#1e40af',
                            color: '#ffffff',
                        },
                    },
                    title: {
                        show: true,
                        offsetCenter: [0, '35%'],
                        fontSize: 13,
                        color: '#475569',
                        fontFamily: 'Kantumruy Pro, sans-serif',
                    },
                    detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        offsetCenter: [0, '70%'],
                        formatter: '{value}%',
                        color: '#1e293b',
                        fontFamily: 'Kantumruy Pro, sans-serif',
                        fontWeight: 'bold',
                    },
                    data: [
                        {
                            value: velocity,
                            name: 'ល្បឿនវឌ្ឍនភាពការងារ',
                        },
                    ],
                },
            ],
        };

        chart.setOption(option);
    }

    // 2. Clickable Column Chart with Gradient (Weekly/Monthly/Quarterly Task Completion)
    private initColumnGradientChart(): void {
        if (!this.columnGradientRef?.nativeElement) return;
        const chart = echarts.init(this.columnGradientRef.nativeElement);
        this._charts.push(chart);

        const categories = this.currentMetrics().columnCategories;
        const data = this.currentMetrics().columnData;

        const option: echarts.EChartsOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
                textStyle: {
                    fontFamily: 'Kantumruy Pro, sans-serif',
                    fontSize: 13,
                },
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '8%',
                top: '12%',
                containLabel: true,
            },
            xAxis: [
                {
                    type: 'category',
                    data: categories,
                    axisTick: {
                        alignWithLabel: true,
                    },
                    axisLabel: {
                        color: '#64748b',
                        fontSize: 12,
                        fontFamily: 'Kantumruy Pro, sans-serif',
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#cbd5e1',
                        },
                    },
                },
            ],
            yAxis: [
                {
                    type: 'value',
                    name: 'ចំនួនកិច្ចការសម្រេច',
                    nameTextStyle: {
                        color: '#64748b',
                        fontFamily: 'Kantumruy Pro, sans-serif',
                        fontSize: 11,
                    },
                    axisLabel: {
                        color: '#64748b',
                        fontFamily: 'Kantumruy Pro, sans-serif',
                    },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: '#f1f5f9',
                        },
                    },
                },
            ],
            series: [
                {
                    name: 'កិច្ចការសម្រេចបាន',
                    type: 'bar',
                    barWidth: '40%',
                    data: data,
                    itemStyle: {
                        borderRadius: [6, 6, 0, 0],
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#38bdf8' },
                            { offset: 0.5, color: '#2563eb' },
                            { offset: 1, color: '#1e3a8a' },
                        ]),
                    },
                },
            ],
        };

        chart.setOption(option);
    }

    // 3. Radial Polar Bar Chart (Workload Allocation)
    private initPolarBarChart(): void {
        if (!this.polarBarRef?.nativeElement) return;
        const chart = echarts.init(this.polarBarRef.nativeElement);
        this._charts.push(chart);

        const data = this.currentMetrics().polarData;

        const option: echarts.EChartsOption = {
            tooltip: {
                trigger: 'item',
                textStyle: {
                    fontFamily: 'Kantumruy Pro, sans-serif',
                },
            },
            polar: {
                radius: [20, '75%'],
            },
            angleAxis: {
                max: 100,
                startAngle: 90,
                axisLabel: {
                    show: false,
                },
                axisLine: {
                    show: false,
                },
                splitLine: {
                    lineStyle: {
                        color: '#f1f5f9',
                    },
                },
            },
            radiusAxis: {
                type: 'category',
                data: ['Frontend', 'Backend', 'QA & Sec', 'DevOps', 'Design'],
                axisLabel: {
                    color: '#475569',
                    fontSize: 11,
                    fontFamily: 'Kantumruy Pro, sans-serif',
                },
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
            },
            series: [
                {
                    type: 'bar',
                    data: data,
                    coordinateSystem: 'polar',
                    name: 'បន្ទុកការងារ %',
                    roundCap: true,
                    itemStyle: {
                        color: (params) => {
                            const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
                            return colors[params.dataIndex % colors.length];
                        },
                    },
                },
            ],
        };

        chart.setOption(option);
    }

    // 4. Horizontal Bar Chart (Team Task Contribution)
    private initHorizontalBarChart(): void {
        if (!this.horizontalBarRef?.nativeElement) return;
        const chart = echarts.init(this.horizontalBarRef.nativeElement);
        this._charts.push(chart);

        const completedData = this.currentMetrics().teamCompleted;
        const activeData = this.currentMetrics().teamActive;

        const option: echarts.EChartsOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
                textStyle: {
                    fontFamily: 'Kantumruy Pro, sans-serif',
                },
            },
            grid: {
                left: '3%',
                right: '6%',
                bottom: '5%',
                top: '5%',
                containLabel: true,
            },
            xAxis: {
                type: 'value',
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: '#f1f5f9',
                    },
                },
                axisLabel: {
                    color: '#64748b',
                    fontFamily: 'Kantumruy Pro, sans-serif',
                },
            },
            yAxis: {
                type: 'category',
                data: ['សេង ស្រីម៉ៅ', 'ប៉ែន ករុណា', 'រស់ ពិសាល', 'គង់ វណ្ណៈ', 'ឡុង ដារ៉ា'],
                axisLabel: {
                    color: '#334155',
                    fontSize: 12,
                    fontFamily: 'Kantumruy Pro, sans-serif',
                },
                axisLine: {
                    lineStyle: {
                        color: '#cbd5e1',
                    },
                },
            },
            series: [
                {
                    name: 'បានបញ្ចប់',
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: true,
                        color: '#fff',
                        fontSize: 11,
                    },
                    emphasis: {
                        focus: 'series',
                    },
                    data: completedData,
                    itemStyle: {
                        color: '#10b981',
                    },
                },
                {
                    name: 'កំពុងធ្វើ',
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: true,
                        color: '#fff',
                        fontSize: 11,
                    },
                    emphasis: {
                        focus: 'series',
                    },
                    data: activeData,
                    itemStyle: {
                        color: '#3b82f6',
                        borderRadius: [0, 4, 4, 0],
                    },
                },
            ],
        };

        chart.setOption(option);
    }
}
