var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    cors: {
        /*
        "origin": [  
                "http://192.168.0.2:8080", 
                "http://localhost:8080",
                "*:8080"
            ],
        "methods": ["GET,HEAD,PUT,PATCH,POST,DELETE"],
        "preflightContinue": false,
        "optionsSuccessStatus": 204
        */
    }
});

const { v4: uuidv4 } = require('uuid');
const { validate } = require('uuid');
const randomExt = require('random-ext');
const dotenv = require('dotenv');
dotenv.config();

// Map containg a player's socket id and their chosen name
var playerSocketNameMap = new Map();

// Map containg a player's socket id and their active game
var playerSocketGameMap = new Map();

// Map containing invite codes and game instance ids
var inviteCodeGameMap = new Map();

var activeGames = [];

var uuidRestrictedCharacters = 
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function getGameById(id) {
    var gameInstance = activeGames.find(game => game.id == id)
    return gameInstance;
}

function getActiveGame(clientSocket) {
    var socketRooms = Array.from(clientSocket.rooms);
    var gameId = socketRooms.filter(room => validate(room));

    // Get GameRoom object
    var game = activeGames.find(room => room.id == gameId);

    return game;
}

function removeActiveGame(gameInstance) {
    var index = activeGames.findIndex(game => 
        game.getInstanceId() == gameInstance.getInstanceId());
    console.log("Index = ", index);
    
    activeGames.splice(index, 1);
    inviteCodeGameMap.delete(gameInstance.getInviteCode());  
}

class Message {
    sender = '';
    body = '';

    constructor(sender, body) {
        this.sender = sender;
        this.body = body;
    }
}

class GameInstance  {
    id;
    inviteCode;
    playerSocketNameMap = new Map();
    playerTurn;
    board;
    messages = [];

    constructor() {
        this.id = uuidv4();
        this.inviteCode = randomExt.restrictedString(uuidRestrictedCharacters, 8, 8);
        this.playerSocketNameMap = new Map();

        // Randomly choose a player to go first
        this.playerTurn = Math.floor(Math.random() * 2);
        this.board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];

        var welcomeMessage = new Message('server', 'Welcome to Stars and Moons!');
        this.sendChatMessage(welcomeMessage);
    }

    getInstanceId() {
        return this.id;
    }

    getInviteCode() {
        return this.inviteCode;
    }

    getPlayerCount() {
        return this.playerSocketNameMap.size;
    }

    getPlayerNumber(socketId) {
        var players = Array.from(this.playerSocketNameMap);
        if (players[0][0] == socketId) {
            return 1;
        }
        else if (players[1][0] == socketId) {
            return 2;
        }
        else {
            return -1;
        }
    }

    getPlayerNameBySocket(socketId) {
        return this.playerSocketNameMap.get(socketId);
    }

    getPlayerNameByNumber(playerNumber) {
        if (playerNumber <= 0) {
            return null;
        }
        else if (playerNumber > this.getPlayerCount()) {
            return null;
        }
        else {
            var playerArray = Array.from(this.playerSocketNameMap);
            return playerArray[playerNumber-1][1];
        }
    }

    getPlayerTurn() {
        return this.playerTurn;
    }

    getBoard() {
        return this.board;
    }

    getBoardValue(i, j) {
        return this.board[i][j];
    }

    setBoardValue(i, j, value) {
        this.board[i][j] = value;
    }

    getChatMessages() {
        return this.messages;
    }

    addPlayer(socketId, playerName) {
        console.log(`Added ${socketId} for ${playerName}`);
        this.playerSocketNameMap.set(socketId, playerName);
    }

    removePlayer(socketId) {
        var playerName = this.playerSocketNameMap.get(socketId);
        console.log(`Removing ${socketId} for ${playerName}`);
        this.playerSocketNameMap.delete(socketId);
    }

    sendChatMessage(message) {
        this.messages.push(message);
        return message;
    }

    sendPlayerJoinMessage(playerName) {
        var playerJoinMessage = new Message('server', `${playerName} has joined
            the game!`);
        return this.sendChatMessage(playerJoinMessage);        
    }

    sendPlayerDisconnectMessage(playerName) {
        var playerDisconnectMessage = new Message('server', `${playerName} has left.`);
        return this.sendChatMessage(playerDisconnectMessage);        
    }

    sendPlayerTurnMessage() {
        var playerTurn = this.playerTurn;
        var playerName = this.playerSocketNameMap.get(playerTurn);

        var playerTurnMessage = new Message('server', `It's ${playerName}'s 
            turn!`);
        return this.sendChatMessage(playerTurnMessage);
    }

    resetBoard() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.board[i][j] = 0;
            }
        }
    }

    boardPositionAvailable(i, j) {
        if (this.getBoardValue(i, j) == 0) {
            return true;
        }
        else {
            return false;
        }
    }

    boardFull() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.boardPositionAvailable(i, j))
                    return false;
            }
        }
        return true;
    }

    startGame() {
        this.resetBoard(); 

        var random = Math.floor(Math.random() * 2);
        var playerSocket = Array.from(this.playerSocketNameMap)[random][0];
        this.playerTurn = playerSocket;
    }

    incrementTurn() {
        var players = Array.from(this.playerSocketNameMap);
        if (players[0][0] == this.playerTurn) {
            this.playerTurn = players[1][0];
        }
        else if (players[1][0] == this.playerTurn) {
            this.playerTurn = players[0][0];
        }
    }

    preventTurn() {
        this.playerTurn = -1;
    }

    checkForVictory(token) {
        console.log('Checking for a win using ', token);

        // Check horizontal victories
        for (let i = 0; i < 3; i++) {
            if ((this.board[i][0] == token) 
                && (this.board[i][1] == token) && (this.board[i][2] == token))
                    return true;
        }

        // Check vertical victories
        for (let j = 0; j < 3; j++) {
            if ((this.board[0][j] == token) 
                && (this.board[1][j] == token) && (this.board[2][j] == token))
                    return true;
        }

        // Check diagonal victories
        if ((this.board[0][0] == token) 
            && (this.board[1][1] == token) && (this.board[2][2] == token))
                return true;

        if ((this.board[2][0] == token) 
            && (this.board[1][1] == token) && (this.board[0][2] == token))
                return true;

        return false;        
    }
}

console.log("Hello from the server!");
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://192.168.0.2:8080"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.SERVER_PORT, function () {
    console.log(`We are now listening on ${server.address().port} \n`);
})

io.on('connection', function (socket) {
    console.log('New connection to server: ', socket.id);

    socket.on('disconnect', (reason) => {     
        console.log('Disconnected from server: ', socket.id);     

        var gameInstance = playerSocketGameMap.get(socket.id);
        if (gameInstance) {
            var playerName = playerSocketNameMap.get(socket.id);
            gameInstance.removePlayer(socket.id);

            if (gameInstance.getPlayerCount() != 0) {
                var playerDisconnectMessage =
                    gameInstance.sendPlayerDisconnectMessage(playerName);
                
                var gameInstanceId = gameInstance.getInstanceId();
                io.to(gameInstanceId).emit('message-received', playerDisconnectMessage);
            }
            else if (gameInstance.getPlayerCount() == 0) {
                var index = activeGames.find(game => game == gameInstance);
                activeGames.splice(index, 1);
                inviteCodeGameMap.delete(gameInstance.getInviteCode());
            }

            playerSocketNameMap.delete(socket.id);
        }
    });

    socket.on('create-game', function (playerName) {       
        var gameInstance = new GameInstance();
        gameInstance.addPlayer(socket.id, playerName);
        gameInstance.sendPlayerJoinMessage(playerName);
        activeGames.push(gameInstance);

        socket.join(gameInstance.getInstanceId());
        inviteCodeGameMap.set(gameInstance.getInviteCode(), 
            gameInstance.getInstanceId());
        playerSocketGameMap.set(socket.id, gameInstance);
        playerSocketNameMap.set(socket.id, playerName);

        socket.emit('game-created', gameInstance.getInviteCode());
        socket.emit('all-messages-received', gameInstance.getChatMessages());
    })

    socket.on('join-game', function (data) {
        var gameInstanceId = inviteCodeGameMap.get(data.inviteCode);
        if (typeof gameInstanceId === 'undefined') {
            console.log('Invite code does not exist');
            socket.emit('game-unavailable');
        }
        else {   
            var gameInstance = getGameById(gameInstanceId);

            if (gameInstance.getPlayerCount() == 2) {
                socket.emit('game-full');                
                return false;
            }
            else {
                gameInstance.addPlayer(socket.id, data.playerName);
                var playerJoinMessage = 
                    gameInstance.sendPlayerJoinMessage(data.playerName);

                socket.join(gameInstanceId); 
                playerSocketGameMap.set(socket.id, gameInstance);
                playerSocketNameMap.set(socket.id, data.playerName);
    
                socket.emit('game-joined');
                socket.emit('all-messages-received', gameInstance.getChatMessages());
                socket.to(gameInstanceId).emit('message-received', playerJoinMessage);
    
                gameInstance.startGame();
                var playerTurnMessage = gameInstance.sendPlayerTurnMessage();
                io.to(gameInstanceId).emit('message-received', playerTurnMessage);

                // Ensure that both players are seeing the same exact board
                io.to(gameInstance.getInstanceId())
                    .emit('board-updated', gameInstance.getBoard());

                return true;
            }
        }        
    })

    socket.on('leave-game', function() {
        var gameInstance = playerSocketGameMap.get(socket.id);
        if (!gameInstance) {
            console.log('Socket not in game...');
            socket.emit('server-timed-out');
            return;  
        }
        gameInstance.removePlayer(socket.id);
        
        socket.leave(gameInstance.getInstanceId());

        if (gameInstance.getPlayerCount() == 0) {
            removeActiveGame(gameInstance);
        }
        else {
            var playerName = playerSocketNameMap.get(socket.id);
            var playerDisconnectMessage = 
                gameInstance.sendPlayerDisconnectMessage(playerName); 
    
            var gameInstanceId = gameInstance.getInstanceId();
            io.to(gameInstanceId).emit('message-received', playerDisconnectMessage);
        }

        gameInstance.resetBoard();
        var boardResetMessage = new Message('server', 'Game will be restarted once new player joins.')
        gameInstance.sendChatMessage(boardResetMessage);
        io.to(gameInstanceId).emit('message-received', boardResetMessage);

        socket.emit('game-left');
    })

    socket.on('show-games', function() {
        var availableGames = [];

        activeGames.forEach((game) => {
            if (game.getPlayerCount() != 2) {
                var owner = game.getPlayerNameByNumber(1);

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
        var gameInstance = getActiveGame(socket);
        if (!gameInstance) {
            console.log('Socket not in game...');
            socket.emit('server-timed-out');
            return;
        }
        var gameInstanceId = gameInstance.getInstanceId();

        var playerChatMessage = new Message(message.sender, message.text); 
        gameInstance.sendChatMessage(playerChatMessage);

        io.to(gameInstanceId).emit('message-received', playerChatMessage);
    })

    socket.on('invite-friend', function (message) {
        var gameInstance = getActiveGame(socket);        
        if (!gameInstance) {
            console.log('Socket not in game...');
            socket.emit('server-timed-out');
            return;
        }
        socket.emit('invite-code-generated', gameInstance.getInviteCode());
    })

    socket.on('click-board', function (area) {
        var gameInstance = getActiveGame(socket);
        if (!gameInstance) {
            console.log('Socket not in game...');
            socket.emit('server-timed-out');
            return;
        }
        if (gameInstance.getPlayerTurn() == socket.id) {
            if (gameInstance.boardPositionAvailable(area.i, area.j)) {
                var playerValue = gameInstance.getPlayerNumber(socket.id);
                gameInstance.setBoardValue(area.i, area.j, playerValue);

                io.to(gameInstance.getInstanceId())
                    .emit('board-updated', gameInstance.getBoard());
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
                        var playerTurnMessage = 
                            gameInstance.sendPlayerTurnMessage();
                        io.to(gameInstance.getInstanceId())
                            .emit('message-received', playerTurnMessage);
                    }
                }
                else {
                    gameInstance.preventTurn();

                    var playerName = gameInstance.getPlayerNameBySocket(socket.id);
                    var playerWinMessage = new Message('server', `${playerName} wins!`); 
                    gameInstance.sendChatMessage(playerWinMessage);    
                    io.to(gameInstance.getInstanceId()).emit('message-received', playerWinMessage);

                    var restartMessage = new Message('server', 'Game will restart in 5 seconds...');
                    io.to(gameInstance.getInstanceId()).emit('message-received', restartMessage);

                    setTimeout(function() {
                        gameInstance.startGame();
                        var playerTurnMessage = 
                            gameInstance.sendPlayerTurnMessage();
                        io.to(gameInstance.getInstanceId())
                            .emit('board-updated', gameInstance.getBoard());
                        io.to(gameInstance.getInstanceId())
                            .emit('message-received', playerTurnMessage);
                    }, 5000);
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