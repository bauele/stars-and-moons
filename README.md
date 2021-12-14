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

Download all of the required packages by running the following command from
the root directory
```
npm install
```

## Running the project
Run the following commands from the root directory to start the server and the
web client
```
node ./server/server.js
npm run serve
```
Then simply open a web browser and connect to http://localhost:8080/ to begin
using the project

## Modifying configurations
By default, the server will launch on http://localhost:3000/ but the port can be
changed using the server port variables in the .env file. If the server is 
being run externally, changes must also be made to the .env file to tell the client
where to find the server.

The server address and port for the client can be changed in the vue.config.js file.

## Asset credits
The file background.png was created by myself using Spacescape, available [here](https://github.com/petrocket/spacescape)

The following assets were created entirely by myself: board.png, moon.png, star.png