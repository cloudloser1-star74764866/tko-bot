const keep_alive  = require('./keep_alive');
keep_alive();

// your bot code...
client.login(process.env.TOKEN);

// ADD THIS AT THE VERY END:
setInterval(() => {
  require('node-fetch')('https://YOUR-RENDER-URL.onrender.com');
}, 4 * 60 * 1000);
