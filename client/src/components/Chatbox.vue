<template>
    <div id='chatbox' class='border border-dark'>
        <div id='message-container'>
            <!--    Due to the CSS styling for div 'message', the messages need to be printed out from
                    newest to oldest, which would mean the array would need to be printed out in
                    reverse.    -->
            <div id='message' v-for='message in reverseMessasges' :key='message.id'>
                <div v-if="message.sender === 'server'" class='serverMessage'>
                    {{ message.body }}
                </div>
                <div v-else>
                    {{ message.sender }}: {{ message.body }}
                </div>
            </div>
        </div>

        <b-form id='form-input-parent' inline v-on:submit.prevent='sendMessage'>
            <b-form-input id='textbox' v-model="text" placeholder='Enter a message'></b-form-input>
            <b-button id='send-button' variant='sm-pink' v-on:click='sendMessage' v-on:keydown.enter='sendMessage'> Send </b-button>
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
/*  Commented out experimenting with media queiries to control
    the size of the chat box */
/*
@media screen and (min-width : 100px) and (max-width : 850px) {
    #chatbox {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        height: 170px;
    }
}
@media screen and (min-width : 850px) and (max-width : 2850px) {
    #chatbox {
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        height: 480px;
    }
}
*/

#chatbox {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

/*  Displaying as flex with a column-reverse make it so that newer
    messages are placed at the bottom of the container and push
    older messages upwards. */
#message-container {   
    display: flex;
    flex-direction: column-reverse;

    /* Scroll area takes up entire available height */
    overflow-y: scroll;
    height: 100%;     
}

/*  Every message div will be responsible for aligning itself
    to the left. */
#message {
    display: flex;
    justify-content: left;
    margin-left: 3px;    
}

.serverMessage {
    color: #fac748;
}

#form-input-parent {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;    
}

#textbox {    
    margin-top: 10px;
    align-content: center;   
    flex-grow: 1;

    margin-right: 5px;
    margin-left: 5px;
}

#send-button {
    height: 37px;
    margin: 10px 10px 5px 5px;    
}
</style>