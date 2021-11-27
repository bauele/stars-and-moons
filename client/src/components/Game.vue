<template>
  <div>
      <p>Game Id = {{ gameId }} </p>  
      <b-row id='game-container'>
        <b-col class lg='auto'>
          <div id="phaser-app"></div>
        </b-col>
        <b-col id='chatbox-container' lg='auto'>
          <Chatbox id='chatbox' />
        </b-col>
      </b-row>
  </div>
</template>

<script>
const axios = require("axios");
const io = require("socket.io-client");

import Chatbox from "./Chatbox.vue";
import { eventEmitter, createGame } from "../game.js";
import {
    mapGetters
} from 'vuex';

export default {
  name: "Game",
  components: {
    Chatbox,
  },

  props: {
      gameId: String,
  },

  data: function () {
    return {
        socket: '',
        userId: '',
    };
  },

  mounted() {
    this.$nextTick(function () {
      createGame();
      console.log("Route = ", this.$route);
      console.log("ID = ", this.$route.params.id);
  })
    eventEmitter.on("game-clicked", (area) => {
        this.clickBoard(area);
    });
  },

  watch: {
    board: function() {
      eventEmitter.emit('game-board-updated', this.board);
    }
  },

  methods: {
    clickBoard(area) {
      this.$store.dispatch('clickBoard', area);
    }
  },
  
  computed: {
    ...mapGetters([
      'inGame',
      'board'
    ]),
  }
};
</script>

<style scoped>

#game-container {
  display: flex;
  justify-content: center;
}

#chatbox-container {
  display: flex;
  justify-content: center;
}

#chatbox {
  min-width: 320px;
  max-width: 480px;
}

</style>