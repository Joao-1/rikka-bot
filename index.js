const fs = require('fs');
const Discord = require('discord.js');
require('dotenv/config');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
};

const cooldowns = new Discord.Collection();

class Server {
	constructor(serverId) {
		this.serverId = serverId;
		this.prefix = 'r!';
	};
};

const servers = {};
function getServer(serverId) {
	if (!servers[serverId]) servers[serverId] = new Server(serverId);
	return servers[serverId];
};

client.on('message', async (message) =>{
	if (message.author.bot) return;
	let prefix;
	let server;
	try {
		server = getServer(message.guild.id);
		prefix = server.prefix;
	}
	catch {
		if (message.channel.type === 'dm') prefix = 'r!';
	};
	if (!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName) ||
  client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.serverOnly && message.channel.type === 'dm') {
		return message.reply('Eu não consigo executar esse comando na DM :(');
	}

	if (command.args && !args.length) {
		let reply = `Acho melhor melhorar este argumento, ${message.author}, otaku fedido!`;

		if (command.usage) {
			reply += `\nUm exemplo: \`${prefix}${command.name} ${command.usage}\``;
		};
		return message.channel.send(reply);
	};
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	};

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownsAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const experitionTime = timestamps.get(message.author.id) + cooldownsAmount;

		if (now < experitionTime) {
			const timeLeft = (experitionTime - now) / 1000;
			return message.reply(`Por favor, espere ${timeLeft.toFixed(1)} segundos antes de usar esse comando novamente`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownsAmount);
	try {
		command.execute(message, args, server);
	}
	catch (err) {
		message.channel.send('Algo de errado aconteceu comigo. Por favor, reporte o meu erro em meu servidor usando:');
		message.channel.send(err);
	};
});

client.on('ready', ()=>{
	console.log(`Bot foi iniciado em ${client.guilds.cache.size} servidores.`);
	const activities = ['r!help'];
	let i = 0;
	setInterval(()=>client.user.setActivity(`${activities[i++ % activities.length]}`,
		{
			type: 'PLAYING',
			// LISTENING, PLAYING, STREAMING
		}), 1000 * 60 * 20);
	client.user
		.setStatus('online')
		.catch(console.log);
	console.log(`O bot está online - ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);
