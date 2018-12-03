// This command will be where we view the message log channel, join message text, DM text, and leavemessage text

// Require Packages
const db = require('quick.db')

exports.run = (bot, message, args, func) => {

    // Variables - These are all the variables that we will be using.
    let channel
    let dmText
    let joinText
    let leaveText

    // First, we need to fetch the message channel
    db.fetchObject(`messageChannel_${message.guild.id}`).then(channelIDFetched => {

        // Verify Arguments - If the text is blank, that means it hasn't been defined yet.
        if (!message.guild.channels.get(channelIDFetched.text)) channel = '*none*'
        else channel = message.guild.channels.get(channelIDFetched.text)
        // What is happening here is that it is trying to see if the CHANNEL ID stored in channelIDFetched.text is a valid channel in the guild, if not it sets channel to none, if it is it sets channel to the channel

        // Next, we can fetch the Join DM Text
        db.fetchObject(`joinMessageDM_${message.guild.id}`).then(joinDMFetched => {

            // Verify Arguments - The same thing is happening here as the last verification. This time it's just checking it joinedDMFetched.text is empty
            if (!joinDMFetched.text) dmText = '*none*'
            else dmText = joinDMFetched.text

            // Now, we want to fetch the join text for the server - accidently put a comma instead of a period there, make sure you don't do that.
            db.fetchObject(`joinMessage_${message.guild.id}`).then(joinTextFetched => {

                // Verify Arguments - Same thing as the last one.
                if (!joinTextFetched.text) joinText = '*none*'
                else joinText = joinTextFetched.text

                // Finally, we can fetch the message thats sent when someone leaves
                db.fetchObject(`leaveMessage_${message.guild.id}`).then(leaveTextFetched => {

                    // Verify Arguments - Same thing as the last one.
                    if (!leaveTextFetched.text) leaveText = '*none*'
                    else leaveText = leaveTextFetched.text

                    // Make sure that all of the fetchObjects are nested inside eachother, or else it might lock the database if it's doing it all at the same time.
                    // Now, lets form a response from all the data we collected.
                    let response = `**Logging Channel**\n > ${channel}\n\n` // This is the first line, make sure to use \n for new lines
                    response += `**Welcome DM Text**\n > ${dmText}\n\n` // Make sure you are using += not = when adding to the string.
                    response += `**Welcome Channel Text**\n > ${joinText}\n\n` // This is the third line.
                    response += `**Leave Channel Text**\n > ${leaveText}\n\n` // Now, lets send the embed using the new function we made earlier.

                    func.embed(message.channel, response) // Lets test it now.

                })


            })

        })

    })

}
