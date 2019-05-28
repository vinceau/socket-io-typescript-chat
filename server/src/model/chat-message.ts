import { Message, User } from './';

export interface ChatMessage extends Message {
    content: string;
}