<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="dark">
      <b-navbar-brand href="#">Stars and Moons</b-navbar-brand>
    </b-navbar>

    <div v-if='inGame'>
      <b-button class='mt-1 mb-1' v-on:click='inviteFriend'> Invite Friend </b-button>
      <Game :gameId=this.gameId>
      </Game>
    </div>

    <div v-else>
      <b-button v-on:click='createGame'>Create Game</b-button>
      <b-button>Join Game</b-button>
    </div>

      <b-modal id='my-modal' ref='my-modal' :hide-footer="true" title="Welcome to Stars and Moons!" @ok="modalSetPlayerName">
        <p class="my-4">What should we call you?</p>
        <b-form-input v-model='playerName'  placeholder="Enter your name"></b-form-input>
        <b-button class='mt-4' @click='modalSetPlayerName'> Submit </b-button>
    </b-modal>

    <Server />

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
      this.$bvModal.show('my-modal');
    })  
  },

  methods: {
    createGame() {
      this.$store.dispatch('createGame');
    },

    joinGame() {
      this.$store.dispatch('joinGame', this.gameId);
    },

    inviteFriend() {
      this.$store.dispatch('inviteFriend');
    },

    showModal() {
      this.$refs['my-modal'].show();
    },

    modalSetPlayerName() {
      console.log(this.playerName);
      this.$bvModal.hide('my-modal');
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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>