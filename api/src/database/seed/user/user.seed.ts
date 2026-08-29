import { DataSource } from 'typeorm';
import { User } from 'src/app/model/user/users.entity';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from 'src/app/enum/pms.enum';

export class UserSeeder {
    public static seed = async (dataSource: DataSource) => {
        try {
            const repo = dataSource.getRepository(User);

            const exists = await repo.findOne({
                where: { phone: '087600063' },
            });

            if (!exists) {
                const salt = await bcrypt.genSalt(10);
                const password = await bcrypt.hash('Pms@1234', salt);

                const userDto: Partial<User> = {
                    sex_id: 1,
                    phone: '087600063',
                    name_kh: 'ឡេង សុខឆាយ',
                    name_en: 'Leng sokchhay',
                    email: 'lengsokchhay.168@gmail.com',
                    password,
                    is_active: 1,
                    auth_provider: AuthProvider.LOCAL,
                };

                await repo.save(repo.create(userDto));
                console.log('\x1b[32mAdmin user seeded successfully.\x1b[0m');
            } else {
                exists.name_kh = 'ឡេង សុខឆាយ';
                exists.name_en = 'Leng sokchhay';
                exists.email = exists.email ?? 'admin@geekdigital.com';
                await repo.save(exists);
                console.log(
                    '\x1b[33mAdmin already exists. Skipping seed.\x1b[0m',
                );
            }

            const mockUsers: Partial<User>[] = [
                {
                    sex_id: 1,
                    phone: '087600064',
                    name_kh: 'ចេង ច័ន្ទបញ្ញា',
                    name_en: 'Cheng Chanpanha',
                    email: 'Chanpanhacheng@gmail.com',
                    telegram_username: '@PanhaisMe',
                },
                {
                    sex_id: 1,
                    phone: '099630996',
                    name_kh: 'ស៊ន់ ​លាង',
                    name_en: 'Sorn Leang',
                    email: 'sornleang005@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '085333335',
                    name_kh: 'បញ្ញា វិរៈទិត្យា',
                    name_en: 'Panha Viraktitya',
                    email: 'viraktitya085@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '015629192',
                    name_kh: 'រិទ្ធ សីហៈ',
                    name_en: 'RITH Seyhak',
                    email: 'seyhakrithwk@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '012554049',
                    name_kh: 'អោយ ចន្ទ័រក្សា',
                    name_en: 'Ory Chanraksa',
                    email: 'ocraksa@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0966773359',
                    name_kh: 'ជៃ រតនា',
                    name_en: 'Chey Rotana',
                    email: 'cheyrotana676@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '087803237',
                    name_kh: 'ទូច​ លីហេង',
                    name_en: 'Touch Lyheng',
                    email: 'touchlyheng50@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '099505752',
                    name_kh: 'ឡុច ទិត្យវិទ្យា',
                    name_en: 'Luch Tithvichea',
                    email: 'luchvichea43@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '087644777',
                    name_kh: 'ហេង ហាក់ឡី',
                    name_en: 'Heng Hakley',
                    email: 'hakleyheng15@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '093569289',
                    name_kh: 'គី​​​ អារីហ្វីន',
                    name_en: 'Ki Arifin',
                    email: 'arifinki0001@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0976001889',
                    name_kh: 'វង់​ រិទ្ធា',
                    name_en: 'Vong Rithea',
                    email: 'vongrithea126@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0964172183',
                    name_kh: 'មុយ​ មេធី',
                    name_en: 'Muy Methy',
                    email: 'methymuy@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0965416704',
                    name_kh: 'ខួច គឿន',
                    name_en: 'Khouch Koeun',
                    email: 'khouch.koeun@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '017915595',
                    name_kh: 'ស៊ត បញ្ញាវន្ត័',
                    name_en: 'Sout Panhavon',
                    email: 'soutpanhavon44@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '069548388',
                    name_kh: 'អ៊ិន ចាន់អាលីហ្សា',
                    name_en: 'In Chanaliza',
                    email: 'inchanaliza@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '093379706',
                    name_kh: 'វុឌ្ឍិន វឌ្ឍនៈ',
                    name_en: 'Vutthin Vatthanak',
                    email: 'vatthanakvutthin@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '0889780646',
                    name_kh: 'ម៉េត សុខជាតិ',
                    name_en: 'Met Sokhcheat',
                    email: 'sokhcheatmet2024@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '092567848',
                    name_kh: 'លី​ ចន្ទ្រសុភៈ',
                    name_en: 'Ly Chansophak',
                    email: 'chansophakly@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '066305360',
                    name_kh: 'ឈី ប៊ុនហួយ',
                    name_en: 'Chhy Bunhouy',
                    email: 'bunhouychhy2@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '012955995',
                    name_kh: 'វ៉ា ហុងថេង',
                    name_en: 'Va Hongtheng',
                    email: 'thengsime4@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0718581781',
                    name_kh: 'អ៊ុន​ ឈុន​លី',
                    name_en: 'Un Chhunly',
                    email: 'unchhunly15@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '087600065',
                    name_kh: 'ស្រីនាង មុនី',
                    name_en: 'Mony Sreyneang',
                    email: 'mony@example.com',
                    telegram_username: 'mony_sreyneang',
                },
                {
                    sex_id: 1,
                    phone: '087600066',
                    name_kh: 'វិសាល ពិសិដ្ឋ',
                    name_en: 'Piseth Visal',
                    email: 'piseth@example.com',
                    telegram_username: 'piseth_visal',
                },
                {
                    sex_id: 2,
                    phone: '087600067',
                    name_kh: 'កញ្ញា លីណា',
                    name_en: 'Lina Kagna',
                    email: 'lina@example.com',
                    telegram_username: 'lina_kagna',
                },
                {
                    sex_id: 1,
                    phone: '087600068',
                    name_kh: 'សុខា រតនា',
                    name_en: 'Rotana Sokha',
                    email: 'rotana@example.com',
                    telegram_username: 'rotana_sokha',
                },
                {
                    sex_id: 1,
                    phone: '093416617',
                    name_kh: 'ឡេង គីមឡាំង',
                    name_en: 'Leng Kimlang',
                    email: 'lengkimlang5@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '087600070',
                    name_kh: 'អុី ស្រីរ័ត្ន',
                    name_en: 'Ei Sreyroth',
                    email: 'ei.sreyroth@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600071',
                    name_kh: 'យឿន សត្យា',
                    name_en: 'Yoeun Satya',
                    email: 'yoeun.satya@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600072',
                    name_kh: 'សំខាន សុវិជ្ជា',
                    name_en: 'Samkhan Sovichea',
                    email: 'samkhan.sovichea@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600073',
                    name_kh: 'ចិន សុផល',
                    name_en: 'Chin Sophal',
                    email: 'chin.sophal@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600074',
                    name_kh: 'យីម ឃ្លោក',
                    name_en: 'Yim Khleok',
                    email: 'yim.khleok@example.com',
                },
                {
                    sex_id: 2,
                    phone: '087600075',
                    name_kh: 'សុខ សុជាតា',
                    name_en: 'Sok Socheata',
                    email: 'sok.socheata@example.com',
                    telegram_username: 'sok_socheata',
                },
                {
                    sex_id: 1,
                    phone: '087600076',
                    name_kh: 'ម៉ៅ វណ្ណៈ',
                    name_en: 'Mao Vannak',
                    email: 'mao.vannak@example.com',
                    telegram_username: 'mao_vannak',
                },
                {
                    sex_id: 2,
                    phone: '087600077',
                    name_kh: 'ហ៊ឹម ចាន់នី',
                    name_en: 'Him Channy',
                    email: 'him.channy@example.com',
                    telegram_username: 'him_channy',
                },
                {
                    sex_id: 1,
                    phone: '087600078',
                    name_kh: 'សេង សុវណ្ណ',
                    name_en: 'Seng Sovann',
                    email: 'seng.sovann@example.com',
                },
                {
                    sex_id: 2,
                    phone: '087600079',
                    name_kh: 'លី សុគន្ធា',
                    name_en: 'Ly Sokuntha',
                    email: 'ly.sokuntha@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600080',
                    name_kh: 'នួន បូរិន',
                    name_en: 'Noun Borin',
                    email: 'noun.borin@example.com',
                },
                {
                    sex_id: 2,
                    phone: '087600081',
                    name_kh: 'គង់ សុភា',
                    name_en: 'Kong Sophea',
                    email: 'kong.sophea@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600082',
                    name_kh: 'ជុំ រ៉ាវី',
                    name_en: 'Chum Ravy',
                    email: 'chum.ravy@example.com',
                },
                {
                    sex_id: 2,
                    phone: '087600083',
                    name_kh: 'ផាន ដាលីន',
                    name_en: 'Phan Dalin',
                    email: 'phan.dalin@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600084',
                    name_kh: 'ម៉េង វិសាល',
                    name_en: 'Meng Visal',
                    email: 'meng.visal@example.com',
                },
                {
                    sex_id: 2,
                    phone: '087600085',
                    name_kh: 'សាន សុធារី',
                    name_en: 'San Sotheary',
                    email: 'san.sotheary@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600086',
                    name_kh: 'អ៊ុក ដារ៉ា',
                    name_en: 'Ouk Dara',
                    email: 'ouk.dara@example.com',
                },
                {
                    sex_id: 1,
                    phone: '11655529',
                    name_kh: 'ទឹក ចាន់សេដ្ឋា',
                    name_en: 'Tek Chansetha',
                    email: 'chansethatek@example.com',
                },
                {
                    sex_id: 1,
                    phone: '093596906',
                    name_kh: 'សុខុម បញ្ញា',
                    name_en: 'Sokhom Panha',
                    email: 'sokhompanha70@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '016309227',
                    name_kh: 'យី មន្នីរម្យ',
                    name_en: 'Yi Monirom',
                    email: 'moniromyi@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '714549167',
                    name_kh: 'សេក ថន',
                    name_en: 'Sek Thorn',
                    email: 'thornsek9@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '095339012',
                    name_kh: 'សំ ណាងអេឡិច',
                    name_en: 'Sam Nangalex',
                    email: 'samnangalex123@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0975654849',
                    name_kh: 'ប៉េង សីហា',
                    name_en: 'Peng Seyha',
                    email: 'pengseyha2005@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '962022272',
                    name_kh: 'សារិទ្ធ សីលា',
                    name_en: 'Sarith Seyla',
                    email: 'sarithseyla9999@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '968253544',
                    name_kh: 'អូន រិទ្ធិ',
                    name_en: 'Oun Rithi',
                    email: 'yoy803530@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '011879636',
                    name_kh: 'ស វិជ្ជដា',
                    name_en: 'Sar Vichada',
                    email: 'sarvichada@gmail.com',
                },
                {
                    sex_id: 2,
                    phone: '965145526',
                    name_kh: 'ថោង សុគិត',
                    name_en: 'Thoung Soket',
                    email: 'thoungsoket@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '089357087',
                    name_kh: 'ព្រៅ វីនុត',
                    name_en: 'Prave Vinuth',
                    email: 'pravevinuth888@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '975725908',
                    name_kh: 'អ៊ិត អែនឈី',
                    name_en: 'ET ANCHHY',
                    email: 'etanchhy@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '969419185',
                    name_kh: 'ប៊ុណ្ណារិទ្ធ សុខស៊ីម',
                    name_en: 'Bunarith Soksim',
                    email: 'soksimnewphone@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '0087987072',
                    name_kh: 'សឿន សិរីវឌ្ឍន៍',
                    name_en: 'SOEUN Sereyvath',
                    email: 'souensereyvath@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '093511331',
                    name_kh: 'សុត ពេជ្របញ្ញា',
                    name_en: 'Soth Pichpanha',
                    email: 'sothpichpanhaedu@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '098787839',
                    name_kh: 'ជឹង គីមឡាយ',
                    name_en: 'Choeng Kimlay',
                    email: 'mingfongmen@gmail.com',
                },
                {
                    sex_id: 1,
                    phone: '087600087',
                    name_kh: 'Brusmuny Pum',
                    name_en: 'Brusmuny Pum',
                    email: 'brusmuny.pum@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600088',
                    name_kh: 'Rom Tola',
                    name_en: 'Rom Tola',
                    email: 'rom.tola@example.com',
                },
                {
                    sex_id: 1,
                    phone: '087600089',
                    name_kh: 'PISETH Panhavorn',
                    name_en: 'PISETH Panhavorn',
                    email: 'piseth.panhavorn@example.com',
                },
            ];

            for (const mockUserData of mockUsers) {
                const userExists = await repo
                    .createQueryBuilder('user')
                    .where('user.phone = :phone', { phone: mockUserData.phone })
                    .orWhere('LOWER(user.email) = LOWER(:email)', {
                        email: mockUserData.email ?? '',
                    })
                    .orWhere('LOWER(user.name_en) = LOWER(:enName)', {
                        enName: mockUserData.name_en ?? '',
                    })
                    .getOne();

                if (!userExists) {
                    const salt = await bcrypt.genSalt(10);
                    const password = await bcrypt.hash('Pms@1234', salt);

                    await repo.save(
                        repo.create({
                            ...mockUserData,
                            password,
                            auth_provider: AuthProvider.LOCAL,
                        }),
                    );
                } else if (mockUserData.phone === '0965416704') {
                    userExists.sex_id = mockUserData.sex_id;
                    userExists.name_kh = mockUserData.name_kh;
                    userExists.name_en = mockUserData.name_en;
                    userExists.email = mockUserData.email;
                    await repo.save(userExists);
                } else if (mockUserData.name_en === 'Leng Kimlang') {
                    userExists.phone = mockUserData.phone;
                    userExists.email = mockUserData.email;
                    await repo.save(userExists);
                } else if (mockUserData.name_en === 'Choeng Kimlay') {
                    userExists.sex_id = mockUserData.sex_id;
                    userExists.phone = mockUserData.phone;
                    userExists.name_kh = mockUserData.name_kh;
                    userExists.name_en = mockUserData.name_en;
                    userExists.email = mockUserData.email;
                    await repo.save(userExists);
                } else if (
                    [
                        'PISETH Panhavorn',
                        'Soth Pichpanha',
                        'SOEUN Sereyvath',
                        'Rom Tola',
                    ].includes(mockUserData.name_en)
                ) {
                    userExists.sex_id = mockUserData.sex_id;
                    userExists.phone = mockUserData.phone;
                    userExists.name_kh = mockUserData.name_kh;
                    userExists.name_en = mockUserData.name_en;
                    userExists.email = mockUserData.email;
                    await repo.save(userExists);
                }
            }

            console.log('\x1b[32mMock users seeded successfully.\x1b[0m');
        } catch (error) {
            console.error('\x1b[31mError seeding user:\x1b[0m', error);
        }
    };
}
