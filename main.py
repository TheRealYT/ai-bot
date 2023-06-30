import poe
import telebot


def what(message):
    client = poe.Client("7oifB7lowK8lxUTL-TnVpw%3D%3D")
    response = ""
    for chunk in client.send_message("capybara", message, with_chat_break=True):
        response += chunk["text_new"]
    return response


bot = telebot.TeleBot(
    "6313102560:AAHcAM7TRGVX2aNmpfjLaeWWOMHSfGm9E6s", parse_mode="Markdown")


@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Try Free AI robot for free")


@bot.message_handler(func=lambda m: True)
def echo_all(message):
    sent = bot.reply_to(message, "Please wait...")
    sent.text = "Wait..."
    bot.reply_to(message, what(message.text))


bot.infinity_polling()
