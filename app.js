// Calling Packages
const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
const db = require('quick.db');

// We can call the file with all the functions here.
const func = require('./functions.js'); // If this returns an error for you (or you might be on ubuntu/linux), try '../functions.js'    
// You can also change the name of func to something else like tools.

// We can call the JSON file here
const commands = JSON.parse(fs.readFileSync('Storage/commands.json', 'utf8'));
// We need to call the serverPrefixes JSON file
const serverPrefixes = JSON.parse(fs.readFileSync('Storage/serverPrefixes.json', 'utf8'))

// Listener Event: Runs whenever a message is received.
bot.on('message', message => {

    // We want to make sure there is a GUILD, and it is not in DMs
    if (message.author.bot) return;
    if (message.channel.type != 'text') return message.channel.send('Please use commands in the server!')

    // Global Settings - We need the prefix to change every time a message is run.
    db.fetchObject(`guildPrefix_${message.guild.id}`).then(i => { // This fetches the current prefix, if none is supplied it would be an empty string.

        let prefix;

        if (i.text) { // This will run if i.text(exisiting prefix) is defined...
            prefix = i.text
        } else { // This will run if i.text(existing prefix) is not defined...
            prefix = '~' // You can set this to your default prefix
        }

        // Variables - Variables make it easy to call things, since it requires less typing.
        let msg = message.content.toUpperCase(); // This variable takes the message, and turns it all into uppercase so it isn't case sensitive.
        let sender = message.author; // This variable takes the message, and finds who the author is.
        let args = message.content.slice(prefix.length).trim().split(" "); // This variable slices off the prefix, then puts the rest in an array based off the spaces
        let cmd = args.shift().toLowerCase(); // This takes away the first object in the cont array, then puts it in this.

        // Message Leveling System - Make sure you require quick.db
        db.updateValue(message.author.id + message.guild.id, 1).then(i => { // You pass it the key, which is authorID + guildID, then pass it an increase which is 1 in this instance.
            // It also returns the new updated object, which is what we will use.

            let messages; // Create an empty variable - These IF statements will run if the new amount of messages sent is the same as the number.
            if (i.value == 25) messages = 25; // Level 1
            else if (i.value == 50) messages = 50; // Level 2
            else if (i.value == 100) messages = 100; // Level 3 - You can set these to any number, and any amount of them.

            if (!isNaN(messages)) { // If messages IS STILL empty, run this.
                db.updateValue(`userLevel_${message.author.id + message.guild.id}`, 1).then(o => { // This returns the updated object of userLevel_ID. 
                    message.channel.send(`You sent ${messages} messages, so you leveled up! You are now level ${o.value}`) // Send their updated level to the channel.
                })
            }

        })

        // We also need to make sure it doesn't respond to bots
        if (!message.content.startsWith(prefix)) return; // We also want to make it so that if the message does not start with the prefix, return.

        // Command Handler - .trim() removes the blank spaces on both sides of the string
        try {
            let commandFile = require(`./commands/${cmd}.js`); // This will assign that filename to commandFile
            commandFile.run(bot, message, args, func); // This will add the functions, from the functions.js file into each commandFile.
        } catch (e) { // If an error occurs, this will run.
            console.log(e.message); // This logs the error message
        } finally { // This will run after the first two clear up
            console.log(`${message.author.username} ran the command: ${cmd}`);
        }

    })

});

// Listener Event: Runs whenever the bot sends a ready event (when it first starts for example)
bot.on('ready', () => {

    // We can post into the console that the bot launched.
    console.log('Bot started.');

});

bot.on('guildMemberAdd', member => { // Make sure this is defined correctly.

    // Check if the guild has a custom auto-role
    db.fetchObject(`autoRole_${member.guild.id}`).then(i => {

        // Check if no role is given
        if (!i.text || i.text.toLowerCase() === 'none'); // We want to put this un our guildMemberAdd, but we want to delete the return statement and just replace it with ; so it can run the rest of the code
        else { // Run if a role is found...

            try { // Try to add role...
                member.addRole(member.guild.roles.find('name', i.text))
            } catch (e) { // If an error is found (the guild supplied an invalid role), run this...
                console.log("A guild tried to auto-role an invalid role to someone.") // You can commet this line out if you don't want this error message
            }

        }

        // The code will go here, inside the other fetchObject. If you don't have that fetchObject don't worry just put it in bot.on('guildMemberAdd').

        // Fetch the channel we should be posting in - FIRST, we need to require db in this app.js
        db.fetchObject(`messageChannel_${member.guild.id}`).then(i => {

            // Fetch Welcome Message (DMs)
            db.fetchObject(`joinMessageDM_${member.guild.id}`).then(o => {

                // DM User
                if (!o.text) console.log('Error: Join DM Message not set. Please set one using ~setdm <message>'); // This will log in console that a guild didn't set this up, you dont need to include the conosle.log
                else func.embed(member, o.text.replace('{user}', member).replace('{members}', member.guild.memberCount)) // This is where the embed function comes in, as well as replacing the variables we added earlier in chat.

                // Now, return if no message channel is defined
                if (!member.guild.channels.get(i.text)) return console.log('Error: Welcome/Leave channel not found. Please set one using ~setchannel #channel') // Again, this is optional. just the console.log not the if statement, we still want to return

                // Fetch the welcome message
                db.fetchObject(`joinMessage_${member.guild.id}`).then(p => {

                    // Check if they have a join message
                    if (!p.text) console.log('Error: User Join Message not found. Please set one using ~setwelcome <message>')
                    else func.embed(member.guild.channels.get(i.text), p.text.replace('{user}', member).replace('{members}', member.guild.memberCount)) // We actually want to send the message.

                })

            })

        })

    })

    // Now, since we're done with the welcome. lets do the leave
    bot.on('guildMemberRemove', member => {

        // Fetch Channel
        db.fetchObject(`messageChannel_${member.guild.id}`).then(i => {

            // If the channel is not found, return.
            if (!member.guild.channels.get(i.text)) return console.log('Error: Welcome/Leave channel not found. Please set one using ~setchannel #channel')

            // Fetch Leave Message
            db.fetchObject(`leaveMessage_${member.guild.id}`).then(o => {
                
                // Check if o.text is defined
                if (!o.text) console.log( 'Error: User leave message not found. Please set one using ~setleave <message>')
                else func.embed(member.guild.channels.get(i.text), o.text.replace('{user}', member).replace('{members}', member.guild.memberCount)) // Now, send the message.

            })

        })

    })

})

bot.login('<token>');
