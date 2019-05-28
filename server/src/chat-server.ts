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

    private rooms: Map<string, string[]>;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();

        this.rooms = new Map<string, string[]>();
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

        // middleware
        this.io.use((socket, next) => {
            const room = socket.handshake.query.room;
            const name = socket.handshake.query.name;
            let peopleInRoom = this.rooms.get(room);
            console.log(peopleInRoom);
            if (!peopleInRoom) {
                console.log(`no one is in room ${room}`);
                return next();
            } else if (peopleInRoom.includes(name)) {
                console.log(`someone called ${name} is already in room ${room}`);
                return next(new Error('someone with the same name already exists'));
            }
            console.log(`${name} is not yet in room ${room}`);
            return next();
        });

    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: SocketIO.Socket) => {
            // console.log(socket);
            const room = socket.handshake.query.room;
            const name = socket.handshake.query.name;
            console.log(`${name} joined ${room}`);

            let peopleInRoom = this.rooms.get(room);
            if (!peopleInRoom) {
                peopleInRoom = [];
            }
            if (!peopleInRoom.includes(name)) {
                this.rooms.set(room, peopleInRoom.concat([name]));
            }
            socket.join(room)
            console.log('Connected client on port %s.', this.port);

            socket.on('message', (m: Message) => {
                console.log('[server](message): %s', JSON.stringify(m));

                // send to everyone in the room including me
                socket.nsp.to(room).emit('message', m);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
                console.log(`${name} left ${room}`);
                let peopleInRoom = this.rooms.get(room);
                this.rooms.set(room, peopleInRoom.filter(p => p !== name));
                console.log(this.rooms.get(room));
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
