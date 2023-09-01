import {Server} from "https://deno.land/std@0.200.0/http/server.ts";
import Bot from "./api.js";

const b = Bot('tefixuca@clout.wiki', {
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

const handler = async () => {
    return new Promise((resolve) => {
        b.getAnswer("Hi").then(ans => {
            resolve(new Response(String(ans), {status: 200}));
        }).catch(reason => {
            console.error(reason)
            resolve(new Response("Hi", {status: 200}));
        })
    })
}

const server = new Server({handler});
const listener = Deno.listen({port: 8080});

console.log("server listening on http://localhost:8080");

await server.serve(listener)