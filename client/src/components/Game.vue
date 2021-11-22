<template>
  <div>
        <p>Game Id = {{ gameId }} </p>  
        <div id="phaser-app"></div>
        <Chatbox />
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