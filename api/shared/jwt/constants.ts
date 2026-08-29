import { appConfig } from 'src/app.config';

const jwtConstants = {
    expiresIn: 3600 * 24,
    secret: appConfig.AUTH.JWT_SECRET,
};

export default jwtConstants;
