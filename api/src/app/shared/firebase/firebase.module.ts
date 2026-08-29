// ===========================================================================>> Core Library
import { Module } from '@nestjs/common';

// ===========================================================================>> Custom Library
// > Local
import { FirebaseService } from './firebase.service';

// ======================================= >> Code Starts Here << ========================== //
@Module({
    providers: [FirebaseService],
    exports: [FirebaseService],
})
export class FirebaseModule {}
