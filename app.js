const Discord = require('discord.js');
const { GiveawaysManager } = require('discord-giveaways');
const config = require('./config.json');
const fs = require('fs');
const mongoose = require('mongoose');
const aliases = require('aliases');
const db = require('./reconDB');
const prefix = config.prefix;
const ytdl = require('ytdl-core');
const prefixSchema = require('./models/prefix');
const bot = new Discord.Client();
const translate = require('@k3rn31p4nic/google-translate-api');
bot.snipes = new Discord.Collection();

require('./dashboard/server')

bot.login(process.env.TOKEN);


mongoose.connect(config.mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}).then(console.log(`Connected To MongoDB !`));

//Per server prefix handler

bot.prefix = async function(message) {
  let custom;

  const data = await prefixSchema.findOne({ Guild: message.guild.id })
  .catch(err => console.log(err))

  if(data) {
    custom = data.prefix;
  } else {
    custom = prefix;
  }
  return custom;
}

//giveaway manager

bot.giveawaysManager = new GiveawaysManager(bot, {
  storage: "./giveaways.json",
  updateCountdownEvery: 5000,
  default: {
      botsCanWin: false,
      exemptPermissions: [],
      embedColor: "#0DFF00",
      reaction: "🎉"
  }
});


//COMMAND HANDLER 

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
fs.readdir('./commands',(err,files) =>{
  if(err) console.log(err);
  let jsfiles = files.filter(f=> f.split(".").pop() === "js");
  
  if(jsfiles.length <= 0) {
    console.log(`NO COMMANDS FOUND !`);
  }

  jsfiles.forEach((f,i)=>{
    let sss = require(`./commands/${f}`);
    bot.commands.set(sss.help.name,sss)
  })
console.log(`LOADED ${jsfiles.length} COMMANDS !`);
})
//play



//EVENT HANDLER 

fs.readdir('./events/',(err,files)=>{
  if(err) return console.error();
  files.forEach(file=>{
    if(!file.endsWith('.js')) return;
    const event = require(`./events/${file}`);
    let eventname = file.split('.')[0];
    console.log(`Loaded ${eventname} Event !`);
    bot.on(eventname , event.bind(null , bot));
  });
  console.log(`Loaded Events !`);
})

//language handler

bot.translate = async(text, message) => {
  const lang = await db.has(`lang-${message.guild.id}`) ? await db.get(`lang-${message.guild.id}`) : 'en';
  const translated = await translate(text, {from: 'en', to: lang});
  return translated.text;
}


