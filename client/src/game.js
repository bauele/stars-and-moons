import Phaser from "phaser";
var events = require('events');

export var eventEmitter = new events.EventEmitter(); 

var gameWidth = 480;
var gameHeight = 480;
var config = {
    type: Phaser.AUTO,
    parent: 'phaser-app',
    width: gameWidth,
    height: gameHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    fps: {
        target: 60,
        forceSetTimeOut: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var boardXPos = 50;
var boardYPos = 50;
var boardWidth = null;
var boardHeight = null;
var nativeTokenSize = 126;
var game = null;

var playerTokens = [];
var tokenTypes = ['star', 'moon'];

export function createGame() {
    game = new Phaser.Game(config);
}

var touple = {
    i: -1,
    j: -1
};

function preload() {
    /*  https://phaser.discourse.group/t/this-load-image-file-path-not-working/1566/6
        Images  have to be in the public folder for Phaser */

    this.load.image('background', './assets/background.png');
    this.load.image('board', './assets/board.png');
    this.load.image('star', './assets/star.png');
    this.load.image('moon', './assets/moon.png');
}

function create() {
    var board = null;
    /*  Game's preferred size is 480x480. If the device screen width is smaller
        than this, scale down based on the amount of screen available. 
        
        Native sizes
        background.png - 512x512
        board.png - 960x960
        tokens - 124x124
    */

    if (screen.width < 480) {
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(1);

        var boardScale = (screen.width - 100) / 960;
        board = this.add.sprite(boardXPos, boardYPos, 'board')
            .setOrigin(0, 0).setScale(boardScale).setInteractive();
        boardWidth = board.displayWidth;
        boardHeight = board.displayHeight;

        game.scale.resize(boardWidth + 100, boardHeight + 100);
    }
    else {
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(1);
        board = this.add.sprite(boardXPos, boardYPos, 'board')
            .setOrigin(0, 0).setScale(.4).setInteractive();
        boardWidth = board.displayWidth;
        boardHeight = board.displayHeight;
    }

    eventEmitter.on('game-board-cleared', () => {        
        playerTokens.forEach((token) => {
            token.destroy();
         })
    })

    eventEmitter.on('game-board-position-updated', (data) => {
        var startX = boardXPos;
        var startY = boardYPos;
        var gridSize = boardWidth / 3;
    
        var rectX = rectX = startX + (gridSize * (data.j));
        var rectY = startY + (gridSize * (data.i));
        var value = data.value;

        if (value != 0) {
            var tokenValue = tokenTypes[value-1];

            var tokenSpriteSize = gridSize * 0.95;
            var tokenSpriteScale = tokenSpriteSize / nativeTokenSize;
            var token = this.add.sprite(rectX + (gridSize / 2), 
                rectY + (gridSize /2), tokenValue).setScale(tokenSpriteScale);

            playerTokens.push(token);
        }
    })
   
    board.on('pointerdown', function (pointer) {
        var area = calculateQuadrant(pointer.position.x, pointer.position.y, 
            boardXPos, boardYPos, boardWidth, boardHeight);

        eventEmitter.emit('game-clicked', area);
    });
}

function update() { 
    playerTokens.forEach((token) => {
        token.angle += 2;
    })
}

function calculateQuadrant(mouseX, mouseY, gridX, gridY, gridW, gridH) {
    var quadrantWidth = gridW / 3;
    var quadrantHeight = gridH / 3;

    var i = -1;
    var j = -1;

    if (mouseX >= gridX && mouseX < gridX + quadrantWidth) {
        j = 0;
    }
    else if (mouseX >= gridX + quadrantWidth 
        && mouseX < gridX + quadrantWidth * 2) {
            j = 1;
    }
    else if (mouseX >= gridX + quadrantWidth * 2 
        && mouseX < gridX + quadrantWidth * 3 
        && mouseX <= gridX + gridW) {
            j = 2;
    }

    if (mouseY >= gridY && mouseY < gridY + quadrantHeight) {
        i = 0;
    }
    else if (mouseY >= gridY + quadrantHeight 
        && mouseY < gridY + quadrantHeight * 2) {
            i = 1;
    }
    else if (mouseY >= gridY + quadrantHeight * 2 
        && mouseY < gridY + quadrantHeight * 3 
        && mouseY <= gridY + gridW) {
            i = 2;
    }

    var area = touple;
    touple.i = i;
    touple.j = j;

    return area;
}