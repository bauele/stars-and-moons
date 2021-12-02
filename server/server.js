var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
    }
});

const { v4: uuidv4 } = require('uuid');
const { validate } = require('uuid');
const randomExt = require('random-ext');

var playerSocketGameMap = new Map();

class GameInstance  {
    id = -1;
    inviteCode = '';
    playerSocketMap = new Map();
    playerTurn = '';
    board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]

    ];
    messages = [];

    sendChatMessage(message) {
        this.messages.push(message);
    }

    setChatMessages(messages) {
        this.messages = messages;
    }

    getChatMessages(messages) {
        return this.messages;
    }

    getInstanceId() {
        return this.id;
    }

    getInviteCode() {
        return this.inviteCode;
    }

    getBoardValue(i, j) {
        return this.board[i][j];
    }

    getBoard() {
        return this.board;
    }

    setBoardValue(i, j, value) {
        this.board[i][j] = value;
    }

    boardPositionAvailable(i, j) {
        if (this.getBoardValue(i, j) == 0) {
            return true;
        }
        else {
            return false;
        }
    }

    addPlayerSocket(socketId, playerName) {
        console.log(`Added ${socketId} for ${playerName}`);
        this.playerSocketMap.set(socketId, playerName);
    }

    removePlayerSocket(socketId) {
        var playerName = this.playerSocketMap.get(socketId);
        console.log(`Removing ${socketId} for ${playerName}`);

        this.playerSocketMap.delete(socketId);
    }

    getPlayerTurn() {
        return this.playerTurn;
    }

    getPlayerNumber(socketId) {
        var players = Array.from(this.playerSocketMap);
        if (players[0][0] == socketId) {
            return 1;
        }
        else if (players[1][0] == socketId) {
            return 2;
        }
        else {
            return 9;
        }
    }

    getPlayerName(socketId) {
        return this.playerSocketMap.get(socketId);
    }

    incrementTurn() {
        var players = Array.from(this.playerSocketMap);
        if (players[0][0] == this.playerTurn) {
            this.playerTurn = players[1][0];
        }
        else if (players[1][0] == this.playerTurn) {
            this.playerTurn = players[0][0];
        }
    }

    initialize() {
        // Randomly decide who is going first
        var random = Math.floor(Math.random() * 2);
        console.log('random = ', random);
        if (random == 0) {
            console.log('Player 1 goes first');
        }
        else {
            console.log('Player 2 goes first');
        }

        console.log(this.playerSocketMap);
        var playerSocket = Array.from(this.playerSocketMap)[random][0];
        this.playerTurn = playerSocket;
        console.log('playerSocket = ', playerSocket);
    }
}

var activeGames = [];
const inviteCodeMap = new Map();
var restrictedCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function createGameInstance() {
    var game = new GameInstance();    

    game.id = uuidv4();
    game.inviteCode = randomExt.restrictedString(restrictedCharacters, 8, 8);
    board = [
        [-1, -1, -1],
        [-1, -1, -1],
        [-1, -1, -1]
    ];

    return game;
}

function getActiveGame(clientSocket) {
    var socketRooms = Array.from(clientSocket.rooms);
    var gameId = socketRooms.filter(room => validate(room));
    console.log('Client is in game = ', gameId);

    // Get GameRoom object
    var game = activeGames.find(room => room.id == gameId);
    console.log('Found game = ', game);

    return game;
}

console.log("Hello from the server!");
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    /*
    res.header("Access-Control-Allow-Origin", "http://localhost:8080"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Head
    ers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
    */
  });


app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, function () {
    console.log(`We are now listening on ${server.address().port} \n`);
})

io.on('connection', function (socket) {
    console.log('New connection of ', socket.id);

    socket.on("disconnect", (reason) => {     
        console.log('Disconnected from game: ', socket.id);

        var gameInstance = playerSocketGameMap.get(socket.id);
        if (gameInstance) {
            var playerName = gameInstance.getPlayerName(socket.id);
            gameInstance.removePlayerSocket(socket.id);

            var playerDisconnectMessage = `${playerName} has disconnected.`;
            gameInstance.sendChatMessage(playerDisconnectMessage);

            var gameInstanceId = gameInstance.getInstanceId();
            io.to(gameInstanceId).emit('message-received', playerDisconnectMessage);
        }
    });

    socket.on('create-game', function (playerName) {       
        var gameInstance = createGameInstance(socket.id);
        gameInstance.sendChatMessage('Welcome to Stars and Moons!');
        gameInstance.addPlayerSocket(socket.id, playerName);
        activeGames.push(gameInstance);

        socket.join(gameInstance.getInstanceId());
        inviteCodeMap.set(gameInstance.getInviteCode(), gameInstance.getInstanceId());
        playerSocketGameMap.set(socket.id, gameInstance);

        var playerJoinMessage = `${playerName} has joined the game!`;
        gameInstance.sendChatMessage(playerJoinMessage);

        socket.emit('game-created', gameInstance.getInviteCode());
        socket.emit('all-messages-received', gameInstance.getChatMessages());
    })

    socket.on('join-game', function (data) {
        //console.log(`Looking up invite code ${data.inviteCode}...`);

        var gameInstanceId = inviteCodeMap.get(data.inviteCode);
        if (typeof gameInstanceId === 'undefined') {
            console.log('Invite code does not exist');

            // Emit an event that would trigger an error page
        }
        else {   
            var gameInstance = activeGames.find(game => game.id == gameInstanceId)

            if (gameInstance.playerSocketMap.size == 2) {
                socket.emit('game-full');
                
                return false;
            }

            socket.join(gameInstanceId);
            gameInstance.addPlayerSocket(socket.id, data.playerName);

            playerSocketGameMap.set(socket.id, gameInstance);

            socket.emit('game-joined');
            socket.emit('all-messages-received', gameInstance.getChatMessages());
    
            var playerJoinMessage = `${data.playerName} has joined the game!`;
            gameInstance.sendChatMessage(playerJoinMessage);
            io.to(gameInstanceId).emit('message-received', playerJoinMessage);

            gameInstance.initialize();
            return true;
        }        
    })

    socket.on('send-chat-message', function (message) {
        var clientSocketRooms = Array.from(socket.rooms);
        var gameInstanceId = clientSocketRooms.find(room => validate(room));


        // Get GameRoom object
        var gameInstance = activeGames.find(room => room.id == gameInstanceId);

        var sender = message.sender;
        var content = message.text;
        var formattedMessage = `${sender}: ${content}`;

        gameInstance.sendChatMessage(formattedMessage);
        io.to(gameInstanceId).emit('message-received', formattedMessage);
    })

    socket.on('invite-friend', function (message) {
       var game = getActiveGame(socket);

        // Check if the game has an active invite code
            // If it doesn't have an active invite code, generate one              
        socket.emit('invite-code-generated', game.getInviteCode());

    })

    socket.on('click-board', function (area) {
        console.log(`Server received the click from: ${socket.id} at ${area.i}, ${area.j}`);

        // Obtain game instance based on the socket sending the request
        var game = getActiveGame(socket);

        // Check to see if player turn is null, because they can click the board before game has started
        if (game.getPlayerTurn() == socket.id) {
            console.log('Checking board to see if you can go there...');

            if (game.boardPositionAvailable(area.i, area.j)) {
                var playerValue = game.getPlayerNumber(socket.id);
                game.setBoardValue(area.i, area.j, playerValue);
                io.to(game.getInstanceId()).emit('board-updated', game.getBoard());
                console.log(game.getBoard());

                game.incrementTurn();              
            }
            else {
                socket.emit('board-not-updated', 'That spot is not available.');
            }
            
        }
        else {
            socket.emit('board-not-updated', 'It is not your turn.');
        }
    })
});