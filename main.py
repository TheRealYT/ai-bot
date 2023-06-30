import poe
import telebot


def what(message, chat_id, message_id):
    client = poe.Client("7oifB7lowK8lxUTL-TnVpw%3D%3D")
    response = ""
    bot.send_chat_action(chat_id, "typing")
    for chunk in client.send_message("capybara", message, with_chat_break=False):
        response += chunk["text_new"]
    bot.edit_message_text(response, chat_id, message_id, parse_mode=None)
    # bot.send_message(chat_id, response, parse_mode=None)


bot = telebot.TeleBot(
    "6313102560:AAHcAM7TRGVX2aNmpfjLaeWWOMHSfGm9E6s", parse_mode=None)


@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(message, "Try Free AI robot for free")


@bot.message_handler(func=lambda m: True)
def echo_all(message):
    sent = bot.reply_to(message, "Please wait...")
    what(message.text, sent.chat.id, sent.message_id)


bot.infinity_polling()
