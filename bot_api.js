function int32() {
    const min = -Math.pow(2, 31);
    const max = Math.pow(2, 31) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class Handler {
    #listeners = {}
    #BOT_TOKEN
    #BOT_URL

    constructor(BOT_TOKEN, BOT_URL) {
        this.#BOT_TOKEN = BOT_TOKEN
        this.#BOT_URL = BOT_URL
    }

    #emmit(event, ...args) {
        if (event in this.#listeners) {
            this.#listeners[event].forEach(callback => {
                callback(...args)
            })
        }
    }

    async #req(endPoint, jsonData) {
        await fetch(
            `https://api.telegram.org/bot${this.#BOT_TOKEN}/${endPoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonData),
            },
        );
    }

    on(event, callback) {
        if (!(event in this.#listeners)) {
            this.#listeners[event] = []
        }

        this.#listeners[event].push(callback)
    }

    async setWebhook() {
        const res = await fetch(`https://api.telegram.org/bot${this.#BOT_TOKEN}/setWebhook?url=${this.#BOT_URL}`);
        return await res.text();
    }

    async sendMessage(chat_id, text, other = {}) {
        await this.#req('sendMessage', {chat_id, text, ...other})
    }

    async sendChatAction(chat_id, action, other = {}) {
        await this.#req('sendChatAction', {chat_id, action, ...other})
    }

    async forwardMessage(chat_id, from_chat_id, message_id, other = {}) {
        await this.#req('forwardMessage', {chat_id, from_chat_id, message_id, ...other})
    }

    parse(body) {
        if ("message" in body) {
            const {message} = body
            const commands = {}
            let found = 0

            if ("entities" in message) {
                message.entities.forEach(entity => {
                    if (entity.type.toLowerCase() === 'bot_command') {
                        commands[message?.text.substring(entity.offset, entity.offset + entity.length)] = true
                    }
                })
            }

            const on = (command, callback) => {
                const exists = command in commands
                if (exists) found++;

                if (exists || (command === '' && found === 0)) {
                    callback();
                }

                return on
            }

            this.#emmit('message', message, on)
        }
    }
}