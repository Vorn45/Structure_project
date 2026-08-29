import { of } from "rxjs";

export const devRoleResolver = (allowedRoles: string[]) => {
    return () => {
        // In development, always allow access regardless of role
        // This bypasses all token validation and role checking
        return of(allowedRoles);
    };
};
