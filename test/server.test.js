const io = require("socket.io-client");


test('Client connection to server', (done) => {
        socket = io.connect('http://localhost:3000', {
        });

        socket.on('connect', () => {
            done();   
        })
});

test('Create game', (done) => {
    socket = io.connect('http://localhost:3000', {
    });  

    socket.on('connect', () => {
        socket.emit('create-game', 'Dylan');
    })

    socket.on('game-created', () => {
        done();
    })
})

test('Generate invite code', (done) => {

    socket = io.connect('http://localhost:3000', {
    });  

    socket.on('connect', () => {
        socket.emit('create-game', 'John');
    })

    socket.on('game-created', () => {
        socket.emit('invite-friend');
        //done();
    })

    socket.on('invite-code-generated', () => {
        done();
    })

})

test('Join game', (done) => {
    player_one = io.connect('http://localhost:3000', {
    });  

    player_two = io.connect('http://localhost:3000', {
    });  

    player_one.on('connect', () => {
        player_one.emit('create-game', 'Lisa');
    })

    player_one.on('game-created', () => {
        player_one.emit('invite-friend');
    })

    player_one.on('invite-code-generated', (inviteCode) => {        
        player_two.emit('join-game', { inviteCode: inviteCode, playerName: 'Cera'});
    })

    player_two.on('game-joined', (messages) => {
        done();
    })
})

//test will only pass if player one goes first
test('Click board', (done) => {
    player_one = io.connect('http://localhost:3000', {
    });  

    player_two = io.connect('http://localhost:3000', {
    });  

    player_one.on('connect', () => {
        player_one.emit('create-game', 'Mike');
    })

    player_one.on('game-created', () => {
        player_one.emit('invite-friend');
    })

    player_one.on('invite-code-generated', (inviteCode) => {        
        player_two.emit('join-game', { inviteCode: inviteCode, playerName: 'Carly'});
    })

    player_two.on('game-joined', (messages) => {
        player_one.emit('click-board', {i: 0, j: 0});
    })

    player_one.on('board-updated', (board) => {
        console.log(board[0][0]);
        if (board[0][0] == 1) {
            done();
        }
    })

    player_one.on('board-not-updated', () => {
        player_two.emit('click-board', {i: 0, j: 0}); 
    })

    player_two.on('board-updated', (board) => {
        console.log(board[0][0]);
        if (board[0][0] == 2) {
            done();
        }
    })
})