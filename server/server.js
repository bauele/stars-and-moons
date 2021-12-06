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

class Message {
    sender = '';
    body = '';

    constructor(sender, body) {
        this.sender = sender;
        this.body = body;
    }
}

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

    resetBoard() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    boardFull() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] == 0)
                    return false;
            }
        }

        return true;
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

        var playerName = this.getPlayerName(this.playerTurn);
        var playerTurnMessage = new Message('server', `It's ${playerName}'s turn!`);
        this.sendChatMessage(playerTurnMessage);

        io.to(this.getInstanceId()).emit('message-received', playerTurnMessage);
    }

    preventTurn() {
        this.playerTurn = -1;
    }

    initialize() {
        // Randomly decide who is going first
        this.resetBoard(); 
        io.to(this.getInstanceId()).emit('board-updated', this.getBoard());

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

        var playerName = this.getPlayerName(playerSocket);
        var playerTurnMessage = new Message('server', `It's ${playerName}'s turn!`);
        this.sendChatMessage(playerTurnMessage);

        io.to(this.getInstanceId()).emit('message-received', playerTurnMessage);
    }

    checkForVictory(token) {
        console.log('Checking for a win using ', token);

        // Check horizontal victories
        for (let i = 0; i < 3; i++) {
            if ((this.board[i][0] == token) && (this.board[i][1] == token) && (this.board[i][2] == token))
                return true;
        }

        // Check vertical victories
        for (let j = 0; j < 3; j++) {
            if ((this.board[0][j] == token) && (this.board[1][j] == token) && (this.board[2][j] == token))
                return true;
        }

        // Check diagonal victories
        if ((this.board[0][0] == token) && (this.board[1][1] == token) && (this.board[2][2] == token))
            return true;

        if ((this.board[2][0] == token) && (this.board[1][1] == token) && (this.board[0][2] == token))
            return true;

        return false;        
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

    // Get GameRoom object
    var game = activeGames.find(room => room.id == gameId);

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

            if (gameInstance.playerSocketMap.size != 0) {
                var playerDisconnectMessage = new Message('server', `${playerName} has disconnected.`);
                gameInstance.sendChatMessage(playerDisconnectMessage);

                var gameInstanceId = gameInstance.getInstanceId();
                io.to(gameInstanceId).emit('message-received', playerDisconnectMessage);
            }
            else if (gameInstance.playerSocketMap.size == 0) {
                var index = activeGames.find(game => game == gameInstance);
                activeGames.splice(index, 1);

                inviteCodeMap.delete(gameInstance.getInviteCode());
            }
        }
    });

    socket.on('create-game', function (playerName) {       
        var gameInstance = createGameInstance(socket.id);

        var welcomeMessage = new Message('server', 'Welcome to Stars and Moons!');
        gameInstance.sendChatMessage(welcomeMessage);
        gameInstance.addPlayerSocket(socket.id, playerName);
        activeGames.push(gameInstance);

        socket.join(gameInstance.getInstanceId());
        inviteCodeMap.set(gameInstance.getInviteCode(), gameInstance.getInstanceId());
        playerSocketGameMap.set(socket.id, gameInstance);

        var playerJoinMessage = new Message('server', `${playerName} has joined the game!`);
        gameInstance.sendChatMessage(playerJoinMessage);

        socket.emit('game-created', gameInstance.getInviteCode());
        socket.emit('all-messages-received', gameInstance.getChatMessages());
    })

    socket.on('join-game', function (data) {
        //console.log(`Looking up invite code ${data.inviteCode}...`);

        var gameInstanceId = inviteCodeMap.get(data.inviteCode);
        if (typeof gameInstanceId === 'undefined') {
            console.log('Invite code does not exist');
            socket.emit('game-unavailable');

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
    
            var playerJoinMessage = new Message('server', `${data.playerName} has joined the game!`);            
            gameInstance.sendChatMessage(playerJoinMessage);

            io.to(gameInstanceId).emit('message-received', playerJoinMessage);

            gameInstance.initialize();
            return true;
        }        
    })

    socket.on('leave-game', function() {
        socket.emit('game-left');
    })

    socket.on('show-games', function() {
        var availableGames = [];

        activeGames.forEach((game) => {
            if (game.playerSocketMap.size != 2) {
                var players = Array.from(game.playerSocketMap);
                var owner = players[0][1];
                
                var joinableGame = {owner: owner, 
                    inviteCode: game.getInviteCode()};

                availableGames.push(joinableGame);
            }
        })

        console.log('Available Games = ', availableGames);
        
        // Change return object to only contain player and invite code
        socket.emit('games-found', availableGames);
    })

    socket.on('send-chat-message', function (message) {
        var clientSocketRooms = Array.from(socket.rooms);
        var gameInstanceId = clientSocketRooms.find(room => validate(room));


        // Get GameRoom object
        var gameInstance = activeGames.find(room => room.id == gameInstanceId);

        var playerChatMessage = new Message(message.sender, message.text); 
        gameInstance.sendChatMessage(playerChatMessage);

        io.to(gameInstanceId).emit('message-received', playerChatMessage);
    })

    socket.on('invite-friend', function (message) {
       var game = getActiveGame(socket);

        // Check if the game has an active invite code
            // If it doesn't have an active invite code, generate one              
        socket.emit('invite-code-generated', game.getInviteCode());

        socket.emit('invite-code-generated', game.getInviteCode());
    })

    socket.on('click-board', function (area) {
        //console.log(`Server received the click from: ${socket.id} at ${area.i}, ${area.j}`);

        // Obtain game instance based on the socket sending the request
        var gameInstance = getActiveGame(socket);

        // Check to see if player turn is null, because they can click the board before game has started

        if (gameInstance.getPlayerTurn() == socket.id) {
            //console.log('Checking board to see if you can go there...');

            if (gameInstance.boardPositionAvailable(area.i, area.j)) {
                var playerValue = gameInstance.getPlayerNumber(socket.id);
                gameInstance.setBoardValue(area.i, area.j, playerValue);
                io.to(gameInstance.getInstanceId()).emit('board-updated', gameInstance.getBoard());
                console.log(gameInstance.getBoard());

                // Check for win condition, increment turn if there is no win condition
                if (!gameInstance.checkForVictory(playerValue)) {
                    //If game board is full, it's a draw
                    if (gameInstance.boardFull()) {
                        gameInstance.preventTurn();

                        var drawMessage = new Message('server', `It's a draw!`); 
                        gameInstance.sendChatMessage(drawMessage);    
                        io.to(gameInstance.getInstanceId()).emit('message-received', drawMessage);    
                        
                        var restartMessage = new Message('server', 'Game will restart in 5 seconds...');
                        io.to(gameInstance.getInstanceId()).emit('message-received', restartMessage);
    
                        setTimeout(function() {gameInstance.initialize()}, 5000);
                    }
                    else {
                        gameInstance.incrementTurn();
                    }
                }
                else {
                    gameInstance.preventTurn();

                    var playerName = gameInstance.getPlayerName(socket.id);
                    var playerWinMessage = new Message('server', `${playerName} wins!`); 
                    gameInstance.sendChatMessage(playerWinMessage);    
                    io.to(gameInstance.getInstanceId()).emit('message-received', playerWinMessage);

                    var restartMessage = new Message('server', 'Game will restart in 5 seconds...');
                    io.to(gameInstance.getInstanceId()).emit('message-received', restartMessage);

                    setTimeout(function() {gameInstance.initialize()}, 5000);
                }               
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