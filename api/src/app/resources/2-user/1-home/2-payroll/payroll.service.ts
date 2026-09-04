// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';

@Injectable()
export class PayrollService {
    async getPayroll(user: UserPayload) {
        return {
            status_code: 200,
            message: 'Payroll slip and salary details retrieved successfully',
            data: {
                current_period: 'ខែសីហា ឆ្នាំ២០២៦',
                salary_slip_id: 'SLIP-2026-08-9921',
                basic_salary: 1500.0,
                net_salary: 1650.0,
                currency: 'USD',
                payment_status: 'paid',
                payment_date: '២៥ សីហា ២០២៦',
                bank_account: {
                    bank_name: 'ABA Bank',
                    account_number: '001 234 567',
                    account_name: user?.name_en || 'CHENG CHANPANHA',
                },
                earnings: [
                    { title: 'ប្រាក់បៀវត្សគោល (Basic Salary)', amount: 1500.0 },
                    { title: 'ប្រាក់ឧបត្ថម្ភការងារ (Performance Bonus)', amount: 150.0 },
                    { title: 'ប្រាក់ថ្លៃបាយ & សាំង (Allowance)', amount: 80.0 },
                ],
                deductions: [
                    { title: 'ពន្ធលើប្រាក់បៀវត្ស (Tax Withholding)', amount: 50.0 },
                    { title: 'ប.ស.ស (NSSF Contribution)', amount: 30.0 },
                ],
                history: [
                    { period: 'កក្កដា ២០២៦', net: '$1,650.00', status: 'បានទូទាត់' },
                    { period: 'មិថុនា ២០២៦', net: '$1,620.00', status: 'បានទូទាត់' },
                    { period: 'ឧសភា ២០២៦', net: '$1,580.00', status: 'បានទូទាត់' },
                ],
            },
        };
    }
}
