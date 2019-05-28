import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import { Message } from './model';

export class ChatServer {
    public static readonly PORT:number = 8080;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    private rooms: Map<string, Array<any>> = new Map<string, Array<any>>();

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || ChatServer.PORT;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {
            console.log(socket);
            const room = socket.handshake.query.room;

            socket.join(room)
            console.log('Connected client on port %s.', this.port);

            socket.on('message', (m: Message) => {
                // const chat = this.io.of(`/room/${m.room}`);
                console.log('[server](message): %s', JSON.stringify(m));
                // this.io.emit('message', m);
                // send to everyone but me
                socket.to(room).emit('message', m);
                // also send to me
                socket.emit('message', m);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
