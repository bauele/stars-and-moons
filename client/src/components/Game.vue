<template>
  <div>
      <b-button class='mt-1 mb-1' variant='sm-purple' v-on:click='inviteFriend'> Invite Friend </b-button>
      <p>Invite Code = {{ inviteCode }} </p>  
      <b-row id='game-container'>
        <b-col class lg='auto'>
          <div id="phaser-app"></div>
        </b-col>
        <b-col id='chatbox-container' lg='auto'>
          <Chatbox id='chatbox' />
        </b-col>
      </b-row>

      <b-toast id='invite-friend-toast' title='Invite link copied!' variant='sm-yellow'>
        Paste this link to a friend so they can join your game!
      </b-toast>
  </div>
</template>

<script>
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

  data: function () {
    return {
        socket: '',
        userId: '',
    };
  },

  mounted() {
    this.$nextTick(function () {
      createGame();
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
    inviteFriend() {
      this.$store.dispatch('inviteFriend');    
      var displayInviteToast = this.$bvToast.show('invite-friend-toast');

      this.$copyText('localhost:8080/' + this.inviteCode).then(
        function () {
          displayInviteToast;
        }(displayInviteToast), 
          
        function (e) {
            alert('Can not copy');
            console.log(e);
        }
      )    
    },

    clickBoard(area) {
      this.$store.dispatch('clickBoard', area);
    }
  },
  
  computed: {
    ...mapGetters([
      'inGame',
      'board',
      'inviteCode'
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