
npm install ytdl-core
npm install discord.js
npm install discord.js node-opus
npm install discord.js opusscript

You would also need to Install FFMPEG.
npm install ffmpeg-binaries
npm install ffmpeg
npm i simple-youtube-api


const Discord = require('discord.js');
const client = new Discord.Client();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const youtube = new YouTube('AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8');
const queue = new Map();
 
 
var prefix = 'J'; 
var servers = {};
stayinchannel=true
client.on("message", async message => {
    var args = message.content.substring(prefix.length).split(" ");
    if (!message.content.startsWith(prefix)) return;
  var searchString = args.slice(1).join(' ');
    var url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    var serverQueue = queue.get(message.guild.id);
    switch (args[0].toLowerCase()) {
      case "p":
    var voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return message.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
        var permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) {
            return message.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
        }
        if (!permissions.has('SPEAK')) {
            return message.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
        }
      if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            var playlist = await youtube.getPlaylist(url);
            var videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                var video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`? Playlist: **${playlist.title}** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    var index = 0;
                    message.channel.send(`
__**Song selection:**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Please provide a value to select one of the search results ranging from 1-10.
                    `);
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return message.channel.send('No or invalid value entered, cancelling video selection.');
                    }
                    var videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return message.channel.send('?? I could not obtain any search results.');
                }
            }
            return handleVideo(video, message, voiceChannel);
        }
        break;
      case "s":
        if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
        if (!serverQueue) return message.channel.send('There is nothing playing that I could skip for you.');
        serverQueue.connection.dispatcher.end('Skip command has been used!');
        return undefined;
        break;
      case "stop":
        if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
        if (!serverQueue) return message.channel.send('There is nothing playing that I could stop for you.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return undefined;
break;
      case "v":
        if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        if (!args[1]) return message.channel.send(`The current volume is: **${serverQueue.volume}**`);
        serverQueue.volume = args[1];
        serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
        return message.channel.send(`I set the volume to: **${args[1]}**`);
break;
      case "np":
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`?? Now playing: **${serverQueue.songs[0].title}**`);
break;
      case "queue":
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`
__**Song queue:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
**Now playing:** ${serverQueue.songs[0].title}
        `);
break;
      case "pause":
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send('? Paused the music for you!');
        }
        return message.channel.send('There is nothing playing.');
break;
      case "resume":
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send('? Resumed the music for you!');
        }
        return message.channel.send('There is nothing playing.');
   
 
    return undefined;
break;
}
async function handleVideo(video, message, voiceChannel, playlist = false) {
    var serverQueue = queue.get(message.guild.id);
    console.log(video);
    var song = {
        id: video.id,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`
    };
    if (!serverQueue) {
        var queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        queue.set(message.guild.id, queueConstruct);
 
        queueConstruct.songs.push(song);
 
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (error) {
            console.error(`I could not join the voice channel: ${error}`);
            queue.delete(message.guild.id);
            return message.channel.send(`I could not join the voice channel: ${error}`);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        if (playlist) return undefined;
        else return message.channel.send(`? **${song.title}** has been added to the queue!`);
    }
    return undefined;
}
  function play(guild, song) {
    var serverQueue = queue.get(guild.id);
 
    if (!song) {
        serverQueue.voiceChannel.stayinchannel();
        queue.delete(guild.id);
        return;
    }
    console.log(serverQueue.songs);
 
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
        .on('end', reason => {
      message.channel.send('``The queue of song is end.``');
            if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
            else console.log(reason);
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
 
    serverQueue.textChannel.send(`?? Start playing: **${song.title}**`);
}
});



client.on('message', message => {
  if (!message.content.startsWith(prefix)) return;
  var args = message.content.split(' ').slice(1);
  var argresult = args.join(' ');
  if (message.author.id !== '572060564524630016') return;

if (message.content.startsWith(prefix + 'g')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`Gamming Mood On `)
} else 

if (message.content.startsWith(prefix + 'w')) {
client.user.setActivity(argresult, {type:'WATCHING'});
    message.channel.sendMessage(`WATCHING Mood On`)
} else 
if (message.content.startsWith(prefix + 'l')) {
client.user.setActivity(argresult, {type:'LISTENING'});
    message.channel.sendMessage(`LISTENING Mood On`)
} else 

if (message.content.startsWith(prefix + 'str')) {
  client.user.setGame(argresult, "https://www.twitch.tv/Justin-Ly0001");
    message.channel.sendMessage(`streaming Mood On`)
	
}

});




client.on('message', async (message) => {
  if (!message.guild || message.author.bot) return;
  let args = message.content.split(' ');
  let id = '572060564524630016';
  if (message.author.id != id) return;
  if (args[0] == `${prefix}setname`) {
    if (!args[1]) return message.reply('Type the new username!');
    try {
      await client.user.setUsername(args.slice(1).join(' '));
      await message.reply('Done :+1:');
    } catch (e) {
      await message.reply(`Error! ${e.message || e}`);
    }
  } else if (args[0] == `${prefix}setavatar`) {
    if (!args[1]) return message.reply('Type the avatar URL!');
    try {
      await client.user.setAvatar(args[1]);
      await message.reply('Êã ÊÛííÑ ÇáÕæÑÉ ');
    } catch (e) {
      message.reply(`ÍÇæá Ýí æÞÊ ÇÎÑ`);
    }
  }
});

	
	
client.on('ready',async () => {
  let GUILDID = '458451052333629450'; 
  let CHANNELID = '477797713937694743'; 
  voiceStay(GUILDID, CHANNELID);
  function voiceStay(guildid, channelid) {
    if(!guildid) throw new Error('Syntax: voiceStay function requires guildid');
    if(!channelid) throw new Error('Syntax: voiceStay function requires channelid');

    let guild = client.guilds.get(guildid);
    let channel = guild.channels.get(channelid);

    if(channel.type === 'voice') {
      channel.join().catch(e => {
        console.log(`Failed To Join :: ${e.message}`);
      });
    } else {
      console.log(`Channel Type :: ${channel.type}, It must be Voice.`);
    }
  }
});






 

 client.login('');