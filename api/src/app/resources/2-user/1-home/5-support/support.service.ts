// ===========================================================================>> Core Library
import { Injectable } from '@nestjs/common';

// ===========================================================================>> Custom Library
import { UserPayload } from 'src/app/interface/jwt.interface';
import { CreateSupportTicketDto } from './support.dto';

export interface SupportTicketItem {
    id: string;
    subject: string;
    category?: string;
    description: string;
    status: string;
    created_at: string;
}

const INITIAL_TICKETS: SupportTicketItem[] = [
    {
        id: 'TCK-8812',
        subject: 'បញ្ហាមិនអាចស្នើសុំច្បាប់លើទូរស័ព្ទដៃ',
        category: 'attendance',
        description: 'នៅពេលចុចលើប្រតិទិន មិនបង្ហាញកាលបរិច្ឆេទជ្រើសរើស។',
        status: 'in_review',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: 'TCK-7740',
        subject: 'ស្នើសុំភ្ជាប់ឧបករណ៍ Passkey ទីពីរ',
        category: 'security',
        description: 'ចង់បន្ថែម MacBook Pro M3 សម្រាប់ Scan TouchID ចូលប្រព័ន្ធ។',
        status: 'resolved',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
];

@Injectable()
export class SupportService {
    private tickets: SupportTicketItem[] = [...INITIAL_TICKETS];

    async getHelpSupport(user: UserPayload) {
        return {
            status_code: 200,
            message: 'Help and support information retrieved successfully',
            data: {
                faqs: [
                    {
                        question: 'តើខ្ញុំអាចស្នើសុំច្បាប់ឈប់សម្រាកដោយរបៀបណា?',
                        answer: 'លោកអ្នកអាចចូលទៅកាន់ម៉ូឌុលវត្តមាន រួចចុចលើប៊ូតុង "ស្នើសុំច្បាប់" និងបំពេញកាលបរិច្ឆេទ។',
                    },
                    {
                        question: 'តើខ្ញុំអាចផ្លាស់ប្តូរលេខសម្ងាត់ ឬ ភ្ជាប់ Passkey យ៉ាងដូចម្តេច?',
                        answer: 'ចូលទៅកាន់ការកំណត់គណនី (Settings) -> សុវត្ថិភាព -> បន្ថែមឧបករណ៍ Passkey ឬ ផ្លាស់ប្តូរលេខសម្ងាត់។',
                    },
                ],
                contacts: {
                    telegram_support: '@nextask_support',
                    email: 'support@nextask.digital',
                    hotline: '023 888 999',
                },
                tickets: this.tickets,
            },
        };
    }

    async createSupportTicket(user: UserPayload, dto: CreateSupportTicketDto) {
        const ticket: SupportTicketItem = {
            id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
            subject: dto.subject,
            category: dto.category,
            description: dto.description,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        this.tickets.unshift(ticket);

        return {
            status_code: 201,
            message: 'Support ticket submitted successfully',
            data: ticket,
        };
    }
}
