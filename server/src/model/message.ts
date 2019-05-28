import {User} from './user';

export interface Message {
    from: User;
    action?: number;
    room: string;
}