import { inject } from "@angular/core";
import { NavigationService } from "app/core/navigation/navigation.service";
import { UserService } from "app/core/user/user.service";
import { RoleEnum } from 'helper/enums/role.enum';

export const devInitialDataResolver = () => {
    const navigationService = inject(NavigationService);
    const userService = inject(UserService);

    // Create mock admin role for development
    const mockRole = {
        id: 1,
        name: RoleEnum.ADMIN,
        slug: 'admin',
        is_default: true,
    };

    // Create mock user with admin role for development
    const mockUser = {
        id: 1,
        name: 'កាក់ សុគី',
        email: 'admin@dev.com',
        phone: '+1234567890',
        avatar: null,
        created_at: new Date(),
        is_active: 1,
        roles: [mockRole],
    };

    // Set mock user and navigation
    // userService.user = mockUser;
    // navigationService.navigations = mockRole;

    // Return empty object since we're not making any async calls
    return {};
};
