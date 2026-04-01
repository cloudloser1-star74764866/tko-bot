const express = require('express');

function keep_alive() {
    const app = express();
    app.get('/', (req, res) => res.send('Bot is running!'));
    const listener = app.listen(process.env.PORT, () => {
        console.log('Your app is listening on port ' + listener.address().port);
    });
    setInterval(() => {
        const http = require('http');
        http.get(`http://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/`);
    }, 300000);
}

module.exports = keep_alive;
