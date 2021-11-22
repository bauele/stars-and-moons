<template>
  <div>
    <p>Trying to connect to server...</p>
    
    <p>{{ result }}</p>
  </div>
</template>

<script>
const axios = require("axios");

export default {
  name: "Server",
  props: {
    msg: String,
  },

  data: function () {
    return {
      result: 0,
    };
  },

  mounted() {
    this.makeServerRequest();
  },

  methods: {
    makeServerRequest: function () {
      axios
        .get("http://localhost:3000/newgame")
        .then((response) => {
          this.result = response.data;
        })
        .catch((error) => {
          this.result = error;
        });    
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

</style>
