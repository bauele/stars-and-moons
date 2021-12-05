<template>
  <b-container id='page-container'>
    <b-button class='mt-3 mb-3' variant='sm-purple' v-on:click='inviteFriend'> Invite Friend </b-button>     
    <b-row id='game-container'>
      <b-col id='game' xs='12' lg='6'>
        <div id="phaser-app"></div>
      </b-col>
      <b-col id='chatbox-container' xs='12' lg='6'>
        <Chatbox id='chatbox' class='h-100' />
      </b-col>
    </b-row>

    <b-toast id='invite-friend-toast' title='Invite link copied!' variant='sm-yellow'>
      Paste this link to a friend so they can join your game!
    </b-toast>
  </b-container>
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
#page-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (min-width : 992px) {
    #chatbox-container {
      display: flex;
      justify-content: center;
      max-height: 75%;
      height: 75%;
    }
}

@media (max-width : 992px) {
    #chatbox-container {
      display: flex;
      justify-content: center;
      max-height: 25%;
      height: 25%;
    }
}

#game-container {

  display: flex;
  align-items: center;
  flex-grow: 1;
  height: 75vh;
  max-height: 75vh;

}

#chatbox {  
  flex-grow: 1; 
  max-width: 480px;
} 
</style>