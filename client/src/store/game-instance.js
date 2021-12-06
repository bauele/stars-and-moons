const io = require("socket.io-client");

export const GameInstance = {
    state: {
        inGame: false,
        clientSocket: null,
        clientPlayerName: null,
        availableGames: null,
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

        setAvailableGames(state, games) {
            state.availableGames = games;
        },

        setChatMessages(state, messages) {
            state.chatMessages = messages;
        },

        sendChatMessage(state, message) {
            state.chatMessages.push(message);
        },

        updateBoard(state, board) {
            state.board = board;
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

        availableGames: state => {
            return state.availableGames;
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
            console.log("Connecting to server...");            
            const socket = io.connect('localhost:3000', {
            });

            socket.on('connect', () => {
                console.log("socket object = ", socket);     
            })

            socket.on('game-created', (inviteCode) => {
                console.log('Creating game...');
                context.commit('setInGame', true);
                context.commit('setInviteCode', inviteCode);
            })

            socket.on('game-joined', (messages) => {
                console.log('Successfully joined game!');
                context.commit('setInGame', true);
            }),

            socket.on('games-found', (games => {
                context.commit('setAvailableGames', games);
            }));

            socket.on('all-messages-received', (messages) => {
                console.log(messages);
                context.commit('setChatMessages', messages);
            })

            socket.on('message-received', (message) => {
                context.dispatch('receiveMessage', message);
            })            

            socket.on('board-updated', (board) => {
                context.commit('updateBoard', board);
            })

            socket.on('invite-code-generated', (inviteCode) => {
                console.log('Got response: ', inviteCode);
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

            return socket;
        },

        clickBoard(context, area) {
            console.log("Vuex clicked at area: ", area);

            context.getters.clientSocket.emit('click-board', area);
        },

        async createGame(context, args) {            
            var clientSocket = await context.dispatch('connectToServer');  
            console.log('Connected!');
            context.commit('setClientSocket', clientSocket);
            clientSocket.emit('create-game', context.getters.clientPlayerName);
        },

        async joinGame(context, inviteCode) {
            var clientSocket = await context.dispatch('connectToServer');
            console.log('Connected!');
            context.commit('setClientSocket', clientSocket);

            context.commit('setInviteCode', inviteCode);
            clientSocket.emit('join-game', { inviteCode: inviteCode, playerName: context.getters.clientPlayerName});

        },

        async showGames(context) {
            var clientSocket = await context.dispatch('connectToServer');
            context.commit('setClientSocket', clientSocket);
            
            clientSocket.emit('show-games');
        },

        sendChatMessage(context, message) {
            console.log("Sending message to server: ", message);

            var messageObject = {sender: context.getters.clientPlayerName,
                                text: message};

            context.getters.clientSocket.emit('send-chat-message', messageObject);        
        },

        receiveMessage(context, args) {
            context.commit('sendChatMessage', args);
        },

        inviteFriend(context, args) {
            console.log('Requesting invite link from server!');
            context.getters.clientSocket.emit('invite-friend');
        },
    }
};