import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPayload } from 'src/app/interface/jwt.interface';
import { Client } from 'src/app/model/organization/client.entity';
import { CreateAdminClientDto, QueryAdminClientDto, UpdateAdminClientDto } from './client.dto';

@Injectable()
export class AdminClientService implements OnModuleInit {
    constructor(
        @InjectRepository(Client)
        private readonly _clientRepo: Repository<Client>,
    ) {}

    async onModuleInit() {
        try {
            const count = await this._clientRepo.count({ withDeleted: true });
            if (count === 0) {
                const defaults = [
                    {
                        company_name: 'Canadia Bank Plc.',
                        name_kh: 'ធនាគារ កាណាឌីយ៉ា',
                        name_en: 'Canadia Bank',
                        email: 'info@canadiabank.com.kh',
                        phone: '023 868 222',
                        industry: 'ធនាគារ និងហិរញ្ញវត្ថុ (Banking & Finance)',
                        contact_person: 'លោក ជា វណ្ណា (VP of Technology)',
                        contact_phone: '012 345 678',
                        contact_email: 'vanna.chea@canadiabank.com.kh',
                        status: 'active' as const,
                        projects_count: 2,
                        address: 'អគារ Canadia Tower មហាវិថីព្រះមុនីវង្ស រាជធានីភ្នំពេញ',
                        website: 'https://www.canadiabank.com.kh',
                        note: 'ដៃគូបច្ចេកវិទ្យាស្នូលសម្រាប់ប្រព័ន្ធគ្រប់គ្រង និងស្វ័យប្រវត្តិកម្ម។',
                    },
                    {
                        company_name: 'Wing Bank (Cambodia) Plc.',
                        name_kh: 'ធនាគារ វីង (ខេមបូឌា)',
                        name_en: 'Wing Bank',
                        email: 'digital@wingmoney.com',
                        phone: '023 999 989',
                        industry: 'ធនាគារឌីជីថល (Fintech & Digital Banking)',
                        contact_person: 'អ្នកស្រី កែវ សុខា (Head of Product)',
                        contact_phone: '010 987 654',
                        contact_email: 'sokha.keo@wingmoney.com',
                        status: 'active' as const,
                        projects_count: 1,
                        address: 'អគារ Wing Tower មហាវិថីព្រះមុនីវង្ស កែងផ្លូវកម្ពុជាក្រោម',
                        website: 'https://www.wingmoney.com',
                        note: 'កិច្ចសហការលើប្រព័ន្ធ Mobile Integration & Payments API។',
                    },
                    {
                        company_name: 'Chip Mong Group',
                        name_kh: 'ក្រុមហ៊ុន ជីប ម៉ុង គ្រុប',
                        name_en: 'Chip Mong Group',
                        email: 'info@chipmong.com',
                        phone: '023 218 060',
                        industry: 'ពាណិជ្ជកម្ម និងអចលនទ្រព្យ (Retail & Real Estate)',
                        contact_person: 'លោក ហេង សំណាង (IT Director)',
                        contact_phone: '077 555 666',
                        contact_email: 'samnang.heng@chipmong.com',
                        status: 'contracted' as const,
                        projects_count: 3,
                        address: 'មហាវិថីសហព័ន្ធរុស្ស៊ី រាជធានីភ្នំពេញ',
                        website: 'https://www.chipmong.com',
                        note: 'គម្រោង WMS Warehouse & Inventory Enterprise System។',
                    },
                    {
                        company_name: 'EDC (Electricite du Cambodge)',
                        name_kh: 'អគ្គិសនីកម្ពុជា (EDC)',
                        name_en: 'Electricite du Cambodge',
                        email: 'contact@edc.com.kh',
                        phone: '023 724 771',
                        industry: 'សេវាសាធារណៈ និងថាមពល (Public Utilities)',
                        contact_person: 'លោក ស៊ុន មុនី (Project Coordinator)',
                        contact_phone: '011 223 344',
                        contact_email: 'mony.sun@edc.com.kh',
                        status: 'active' as const,
                        projects_count: 1,
                        address: 'ផ្លូវលេខ ១៩ វត្តភ្នំ ដូនពេញ រាជធានីភ្នំពេញ',
                        website: 'https://www.edc.com.kh',
                        note: 'ប្រព័ន្ធគ្រប់គ្រងទិន្នន័យ និងរបាយការណ៍បច្ចេកទេស។',
                    },
                    {
                        company_name: 'Khmer Beverages Co., Ltd.',
                        name_kh: 'ក្រុមហ៊ុន ខ្មែរ ប៊ែវើរីជីស',
                        name_en: 'Khmer Beverages',
                        email: 'sales@khmerbeverages.com',
                        phone: '023 424 555',
                        industry: 'ផលិតកម្ម និងចែកចាយ (F&B / Manufacturing)',
                        contact_person: 'លោកស្រី ម៉េង ចរិយា (Supply Chain Manager)',
                        contact_phone: '089 778 899',
                        contact_email: 'chariya.meng@khmerbeverages.com',
                        status: 'lead' as const,
                        projects_count: 0,
                        address: 'ផ្លូវលេខ ២១៧ ជើងឯក ដង្កោ រាជធានីភ្នំពេញ',
                        website: 'https://www.khmerbeverages.com',
                        note: 'កំពុងពិភាក្សាលើដំណោះស្រាយ Supply Chain & Logistics Automation។',
                    },
                ];
                for (const item of defaults) {
                    await this._clientRepo.save(this._clientRepo.create(item));
                }
            }
        } catch (e) {
            console.warn('[AdminClientService] initial client seed warning:', e);
        }
    }

    async getClients(user: UserPayload, query: QueryAdminClientDto) {
        const qb = this._clientRepo.createQueryBuilder('client');

        if (query.search) {
            const s = `%${query.search.toLowerCase().trim()}%`;
            qb.andWhere(
                '(LOWER(client.company_name) LIKE :s OR LOWER(client.name_kh) LIKE :s OR LOWER(client.name_en) LIKE :s OR LOWER(client.email) LIKE :s OR client.phone LIKE :s OR LOWER(client.contact_person) LIKE :s)',
                { s },
            );
        }

        if (query.status && query.status !== 'all') {
            qb.andWhere('client.status = :status', { status: query.status });
        }

        if (query.industry && query.industry !== 'all') {
            qb.andWhere('LOWER(client.industry) LIKE :industry', {
                industry: `%${query.industry.toLowerCase()}%`,
            });
        }

        if (query.sort === 'name_asc') {
            qb.orderBy('client.company_name', 'ASC');
        } else if (query.sort === 'name_desc') {
            qb.orderBy('client.company_name', 'DESC');
        } else {
            qb.orderBy('client.created_at', 'DESC');
        }

        const [results, total] = await qb.getManyAndCount();

        return {
            status_code: 200,
            message: 'Clients retrieved successfully',
            data: {
                results,
                total,
            },
        };
    }

    async getClientById(user: UserPayload, id: number) {
        const client = await this._clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client with ID ${id} not found`);

        return {
            status_code: 200,
            message: 'Client retrieved successfully',
            data: client,
        };
    }

    async createClient(user: UserPayload, dto: CreateAdminClientDto) {
        const companyName = dto.company_name?.trim();
        const newClient = this._clientRepo.create({
            ...dto,
            company_name: companyName,
            name_kh: dto.name_kh?.trim() || companyName,
            name_en: dto.name_en?.trim() || companyName,
            email: dto.email?.trim() || undefined,
            phone: dto.phone?.trim() || undefined,
            organization_id: user?.organization_id || undefined,
        });
        const saved = await this._clientRepo.save(newClient);

        return {
            status_code: 201,
            message: 'Client created successfully',
            data: saved,
        };
    }

    async updateClient(user: UserPayload, id: number, dto: UpdateAdminClientDto) {
        const client = await this._clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client with ID ${id} not found`);

        if (dto.company_name) dto.company_name = dto.company_name.trim();
        if (dto.email) dto.email = dto.email.trim();
        if (dto.phone) dto.phone = dto.phone.trim();

        Object.assign(client, dto);
        const updated = await this._clientRepo.save(client);

        return {
            status_code: 200,
            message: 'Client updated successfully',
            data: updated,
        };
    }

    async toggleClientStatus(user: UserPayload, id: number) {
        const client = await this._clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client with ID ${id} not found`);

        client.status = client.status === 'active' ? 'inactive' : 'active';
        const updated = await this._clientRepo.save(client);

        return {
            status_code: 200,
            message: `Client status changed to ${client.status}`,
            data: updated,
        };
    }

    async deleteClient(user: UserPayload, id: number) {
        const client = await this._clientRepo.findOne({ where: { id } });
        if (!client) throw new NotFoundException(`Client with ID ${id} not found`);

        await this._clientRepo.softDelete(id);

        return {
            status_code: 200,
            message: 'Client deleted successfully',
        };
    }
}
