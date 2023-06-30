# import asyncio
import poe
import telebot

bot = telebot.TeleBot("6313102560:AAHcAM7TRGVX2aNmpfjLaeWWOMHSfGm9E6s", parse_mode=None)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Howdy, how are you doing?")

@bot.message_handler(func=lambda m: True)
def echo_all(message):
    bot.reply_to(message, what(message.text))
    # asyncio.run(respond)

bot.infinity_polling()

# async def respond(msg):
#     await what()
#     bot.reply_to(msg, msg.text)

async def what(message):
    client = poe.Client("7oifB7lowK8lxUTL-TnVpw%3D%3D")
    response = ""
    for chunk in await client.send_message("capybara", message, with_chat_break=True):
        response += chunk["text_new"]
    return response
