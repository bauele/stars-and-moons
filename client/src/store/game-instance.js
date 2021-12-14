const io = require("socket.io-client");
import { eventEmitter } from "../game";

export const GameInstance = {
    state: {
        inGame: false,
        clientSocket: null,
        clientPlayerName: null,
        joinableGames: [],
        inviteCode: null,
        chatMessages: [], 
        board: null,
    },

    mutations: {
        setClientSocket(state, socket) {
            state.clientSocket = socket;
        },

        setClientPlayerName(state, name) {
            state.clientPlayerName = name;
        },

        setInGame(state, value) {
            state.inGame = value;
        },

        setInviteCode(state, inviteCode) {
            state.inviteCode = inviteCode;
        },

        setJoinableGames(state, games) {
            state.joinableGames = games;
        },

        setChatMessages(state, messages) {
            state.chatMessages = messages;
        },

        sendChatMessage(state, message) {
            state.chatMessages.push(message);
        },

        clearBoard(state, board) {
            state.board = board;
            eventEmitter.emit('game-board-cleared');
        },

        // TODO: Remove
        updateBoard(state, board) {
            state.board = board;
        },

        updateBoardPosition(state, data) {
            state.board[data.i][data.j] = data.value;
            eventEmitter.emit('game-board-position-updated', data);
        }
     },

    getters: {
        inGame: state => {
            return state.inGame;
        },

        chatMessages: state => {
            return state.chatMessages;
        },

        clientSocket: state => {
            return state.clientSocket;
        },

        clientPlayerName: state => {
            return state.clientPlayerName;
        },

        joinableGames: state => {
            return state.joinableGames;
        },

        inviteCode: state => {
            return state.inviteCode;
        },

        board: state => {
            return state.board;
        }
    },

    actions: {
        async connectToServer(context) {
            var serverAddress;
            if (process.env.VUE_APP_SERVER_PORT == '') {
                serverAddress = process.env.VUE_APP_SERVER_ADDR;
            }
            else {
                serverAddress = process.env.VUE_APP_SERVER_ADDR 
                    + ":" + process.env.VUE_APP_SERVER_PORT;
            }

            console.log("Connecting to server: ", serverAddress);           
            const socket = io.connect(serverAddress, {
            });

            socket.on('connect', () => {    
            })

            socket.on('game-created', (inviteCode) => {
                context.commit('setInGame', true);
                context.commit('setInviteCode', inviteCode);
            })

            socket.on('game-joined', (messages) => {
                context.commit('setInGame', true);
            })

            socket.on('game-left', () => {
                context.commit('setInGame', false);
            })

            socket.on('joinable-games-updated', (games) => {
                context.commit('setJoinableGames', games);
            })

            socket.on('all-messages-received', (messages) => {
                context.commit('setChatMessages', messages);
            })

            socket.on('message-received', (message) => {
                context.dispatch('receiveMessage', message);
            })            

            // Update: REMOVE
            socket.on('board-updated', (board) => {
                context.commit('updateBoard', board);
            })

            socket.on('board-cleared', (board) => {
                context.commit('clearBoard', board);
            })

            socket.on('board-position-updated', (data) => {
                context.commit('updateBoardPosition', data);
            })

            socket.on('invite-code-generated', (inviteCode) => {
                context.commit('setInviteCode', inviteCode);
            })

            socket.on('game-full', () => {
                alert('Game is already full!');
                socket.disconnect();
            })

            socket.on('game-unavailable', () => {
                alert('Invite code is invalid.');
            
                // Remove invalid invite code from URL
                window.history.pushState('object or string', 'Title', '/');

                socket.disconnect();
            })

            socket.on('server-timed-out', () => {
                alert('Your connection to the server has timed out.');
                context.dispatch('handleTimeout');
            })

            return socket;
        },

        clickBoard(context, area) {
            context.getters.clientSocket.emit('click-board', area);
        },

        async createGame(context, args) {            
            var clientSocket = await context.dispatch('connectToServer');  
            context.commit('setClientSocket', clientSocket);
            clientSocket.emit('create-game', context.getters.clientPlayerName);
        },

        async joinGame(context, inviteCode) {
            var clientSocket = await context.dispatch('connectToServer');
            context.commit('setClientSocket', clientSocket);

            context.commit('setInviteCode', inviteCode);
            clientSocket.emit('join-game', { inviteCode: inviteCode, playerName: context.getters.clientPlayerName});
        },

        leaveGame(context) {
            context.getters.clientSocket.emit('leave-game');
        },

        async showGames(context) {
            if (context.getters.clientSocket == null) {
                var clientSocket = await context.dispatch('connectToServer');
                context.commit('setClientSocket', clientSocket);
            }
            
            context.getters.clientSocket.emit('show-games');
        },

        sendChatMessage(context, message) {
            var messageObject = {sender: context.getters.clientPlayerName,
                                text: message};

            context.getters.clientSocket.emit('send-chat-message', messageObject);        
        },

        receiveMessage(context, args) {
            context.commit('sendChatMessage', args);
        },

        inviteFriend(context, args) {
            context.getters.clientSocket.emit('invite-friend');
        },

        handleTimeout (context) {
            context.commit('setInGame', false);
            context.commit('setInviteCode', null);
            context.commit('setChatMessages', []);
            context.commit('updateBoard', null);
        }
    }
};