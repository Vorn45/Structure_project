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

@Injectable()
export class SupportService {
    private tickets: SupportTicketItem[] = [];

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
                    telegram_support: '@digitechkh_support',
                    email: 'support@digitechkh.com',
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
