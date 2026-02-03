import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';
export const Ownership = () => SetMetadata(OWNERSHIP_KEY, true);