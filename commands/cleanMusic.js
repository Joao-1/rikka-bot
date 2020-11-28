const music = require("./music");

module.exports = {
    name: 'limpar',
    aliases:['l','clean'],
    description: 'Limpa a fila de música do servidor.',
    serveOnly: true,
    usage: '&limpar',
    execute(message){
        let player = music.getPlayer(message.guild.id);
        if(player.queue.length > 1){
            player.queue.splice(1);
            message.channel.send("Fila limpa!");
        }else{
            message.channel.send("A fila já está limpa.");
        };
    },
};