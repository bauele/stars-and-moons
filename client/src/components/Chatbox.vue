<template>
    <div id='chatbox' class='border border-dark'>
        <div id='message-container'>
            <!--    Due to the CSS styling for div 'message', the messages need to be printed out from
                    newest to oldest, which would mean the array would need to be printed out in
                    reverse.    -->
            <div id='message' v-for='message in reverseMessasges' :key='message.id'>
                {{ message }}
            </div>
        </div>

        <b-form v-on:submit.prevent='sendMessage'>
            <b-form-input id='textbox' v-model="text" placeholder='Enter a message'></b-form-input>
            <b-button id='send-button' v-on:click='sendMessage' v-on:keydown.enter='sendMessage'> Send </b-button>
        </b-form>
    </div>
</template>

<script>
import {
    mapGetters
} from 'vuex';

export default {
    name: 'Chatbox',
    data: function() {
        return {
            text: ''
        }
    },

    methods: {
        sendMessage(e) {
            e.preventDefault();

            this.$store.dispatch('sendChatMessage', this.text);
            this.text = ''; 
        },
    },

    computed: {
        reverseMessasges() {
            return this.chatMessages.slice().reverse();
        },

        ...mapGetters([
            'chatMessages',
        ])
    }
}
</script>

<style>
/*  The properties here center the 'chatbox' div. If removed,
    it will not be centered. */
#chatbox {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-height: 480px;
}

/*  Displaying as flex with a column-reverse make it so that newer
    messages are placed at the bottom of the container and push
    older messages upwards. */
#message-container {   
    display: flex;
    flex-direction: column-reverse;
    flex-grow: 1;
    overflow-y: scroll;

    max-width: 100%;
}

/*  Every message div will be responsible for aligning itself
    to the left. */
#message {
    display: flex;
    justify-content: left;
    margin-left: 3px;
}

#textbox {    
    margin-top: 10px;
    align-content: center;   
}

#send-button {
    margin-top: 10px;
    margin-bottom: 10px;
}
</style>