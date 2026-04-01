const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Bot is alive!');
});

function keepAlive() {
  console.log("ENV PORT =", process.env.PORT);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log('Server is ready on port ' + port);
  });
}

module.exports = keepAlive;
