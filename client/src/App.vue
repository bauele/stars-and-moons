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
        <b-button class='pink-button'>Join Game</b-button>
      </div>
    </div>

      <b-modal id='name-modal' ref='name-modal' 
        header-bg-variant='sm-pink'
        header-text-variant='sm-light'
        header-border-variant='light'
        body-bg-variant='sm-purple'
        body-text-variant='sm-light'
        :hide-footer="true" title="Welcome to Stars and Moons!" @ok="modalSetPlayerName">

        <p class="my-4">What should we call you?</p>
        <b-form-input v-model='playerName'  placeholder="Enter your name"></b-form-input>
        <b-button variant='sm-dark' class='mt-4' @click='modalSetPlayerName'> Submit </b-button>
    </b-modal>
  </div>
</template>

<script>
import Server from './components/Server.vue';
import Game from "./components/Game.vue";

import {
    mapGetters
} from 'vuex';


export default {
  name: 'App',
  components: {
    Server,
    Game
  },

  data: function () {
    return {
      gameId: '',
      playerName: ''
    };  
  },

  mounted() {
    //this.$store.dispatch('connectToServer');

    this.$nextTick(function () {
      this.$bvModal.show('name-modal');
    })  
  },

  methods: {
    createGame() {
      this.$store.dispatch('createGame');
    },

    joinGame() {
      this.$store.dispatch('joinGame', this.gameId);
    },

    showModal() {
      this.$refs['name-modal'].show();
    },

    modalSetPlayerName() {
      console.log(this.playerName);
      this.$bvModal.hide('name-modal');
      this.$store.commit('setClientPlayerName', this.playerName);

      this.gameId = this.$route.params.id;
      if (this.gameId != '') {
        console.log('Attempting to join existing game');
        this.joinGame();
      }
    }
  },

  computed: {
    ...mapGetters([
        'inGame',        
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