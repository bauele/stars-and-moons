<template>
  <div id="app">
    <div v-if='inGame'>
      <Game :gameId=this.gameId>
      </Game>
    </div>

    <div v-else id='main-content-container'>
      <div id='main-content'>
        <h1 class='mb-3'>Stars and Moons</h1>
        <b-button class='mr-3 purple-button' v-on:click='createGame' >Create Game</b-button>
        <b-button class='pink-button' v-on:click='showGames'>Join Game</b-button>
        
          <b-row v-if='browseGames' class='mt-3'>
            <p v-if='joinableGames.length==0'>Looks like there's no games right now. Wanna create one?</p>
            <b-col class='game-item'
              v-for='game in joinableGames' :key='game.id'>
                {{ game.owner }}'s Game
                <b-button variant='sm-yellow' size='sm' v-on:click='joinJoinableGame(game.inviteCode)'> Join </b-button>
            </b-col>
          </b-row>
      </div>
    </div>

      <b-modal id='name-modal' ref='name-modal' 
        header-bg-variant='sm-pink'
        header-text-variant='sm-light'
        header-border-variant='light'
        body-bg-variant='sm-purple'
        body-text-variant='sm-light'
        @hidden='modalSetPlayerName'
        :hide-footer="true" title="Welcome to Stars and Moons!" >

        <p class="my-4">What should we call you?</p>
        <b-form-input v-model='playerName'  :placeholder=this.randomName></b-form-input>
        <b-button variant='sm-dark' class='mt-4' @click='modalSetPlayerName'> Submit </b-button>
    </b-modal>
  </div>
</template>

<script>
import Game from "./components/Game.vue";

import {
    mapGetters
} from 'vuex';


export default {
  name: 'App',
  components: {
    Game
  },

  data: function () {
    return {
      gameId: '',
      randomName: '',
      playerName: '',
      browseGames: false,
      joiningGame: false,
    };  
  },

  mounted() {
    this.$nextTick(function () {
      this.randomName = this.generateRandomName();
      this.$bvModal.show('name-modal');
    })
  },

  methods: {
    createGame() {
      this.browseGames = false;
      this.$store.dispatch('createGame');
    },

    joinGame() {
      this.$store.dispatch('joinGame', this.gameId);
    },

    joinJoinableGame(inviteCode) {
      this.browseGames = false;
      this.$store.dispatch('joinGame', inviteCode);
    },

    showGames() {
      this.$store.dispatch('showGames');
      this.browseGames = true;
    },

    showModal() {
      this.$refs['name-modal'].show();
    },

generateRandomName() {
      var randomNumber = Math.floor(Math.random() * 20);
      var names = [
        'unusual-coder', 'trivial-mastermind', 'aqua-devotee', 'brilliant-light',
        'forever-zone', 'lost-melody', 'eternal-august', 'ghost-flower', 'neo-noir',
        'random-sequence', 'forgotten-saga', 'last-hope', 'macbook-zealot', 'pc-guru',
        'horse-girl', 'social-devourer', 'cookie-monster', 'fresh-shower', 'rock-tumble',
        'git-commit' 
      ];

      return names[randomNumber];
    },

    modalSetPlayerName() {      
      this.$bvModal.hide('name-modal');
      if (this.playerName == '') {
        this.playerName = this.randomName;
      }

      this.$store.commit('setClientPlayerName', this.playerName);

      this.gameId = this.$route.params.id;
      if (this.gameId != undefined) {
        if (!this.joiningGame) {
          this.joinGame();
          this.joiningGame = true;
        }
      }
    }
  },

  computed: {
    ...mapGetters([
        'inGame',
        'joinableGames'     
    ]),
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 0px;
  text-align: center;
  background-color: #191923;
  color: #F9E9EC;
  width: 100%;
  min-height: 100vh;
}

#main-content-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;  
}

#main-content {
  align-self: center;
}

.game-item {
  border: 1px solid grey;
  margin-top: 3px;
  margin-left: 3px;
  margin-right: 3px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.purple-button {
  background-color: #6200ff !important;
  border-width: 1px !important;
  border-color: #4600b8 !important;
}

.pink-button {
  background-color: #ff005e !important;
  border-width: 1px !important;
  border-color: #b80043 !important;
}
</style>