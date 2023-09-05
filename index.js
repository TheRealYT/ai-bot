import {Application, Router} from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {oakCors} from "https://deno.land/x/cors@v1.2.2/mod.ts";

import Bot from "./ai_api.js";
import Handler from "./bot_api.js";

const bot = Bot('tefixuca@clout.wiki', {
    bitoUserWsId: '526669',
    otpObj: {
        sixDigitAuthCode: "077287672529828347",
        newUser: false,
        userId: 828347
    },
    bitoaiToken: "077287672529828347",
    uIdForXClient: "4ade8d73-af1e-000f-b284-a4c8e638a490",
    currentSessionID: "fcc4c0fa-8e14-4132-90a1-ef2613e2315f"
})

const handler = new Handler(Deno.env.get("BOT_TOKEN"), Deno.env.get("BOT_URL"))
const _ID_ = 958984293

const app = new Application();
const router = new Router();
router.get("/init", async (ctx) => {
    ctx.response.body = await handler.setWebhook();
});

router.get("/hello", async (ctx) => {
    ctx.response.body = "World";
});

handler.on('message', async (message, on) => {
    on('/start', async () => {
        await handler.sendMessage(message.from.id, 'Hi')
    })('', async () => {
        if (message?.text.length > 0) {
            await handler.sendChatAction(message.chat.id, "typing")

            const ans = await bot.getAnswer(message.text)
            await handler.sendMessage(message.from.id, ans, {
                reply_to_message_id: message.message_id
            })

            console.log(bot.getQuestionContext())
        }
    })
})

app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (ctx) => {
    if (ctx.request.hasBody) {
        const body = await ctx.request.body().value;
        ctx.response.body = "";

        console.log(body);
        handler.parse(body)
    }
});

await app.listen({port: 80});