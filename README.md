# Stars and Moons
Stars and Moons is a tic tac toe game built with node.js, socket.io, Phaser, 
and vue.js. Players create their own game room on the server and then are given 
an invite link to easily allow their friends to connect to the same room to 
play.

## Project setup
The project is divided into three directories: client, server, and test. The
client directory includes all of the front end specific code, such as the UI
and the game itself. The server directory contains all of the back end
specific code, such as the server connection logic and game validation.
The test directory only contains tests on the server logic and is not
required to run the project.

Download all of the required packages by running the following commands from
the root directory
```
npm install ./server
npm install ./client
```

## Running the project
Run the following commands from the root directory to start the server and the
web client
```
node ./server server.js
npm run --prefix ./client serve
```
Then simply open a web browser and connect to http://localhost:8080/ to begin
using the project