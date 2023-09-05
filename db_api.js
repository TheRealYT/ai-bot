const BASE_URL = "https://eu-central-1.aws.data.mongodb-api.com/app/data-ywknt/endpoint/data/v1/action/"

function DB() {
    async function exec(action, data = {}) {
        const response = await fetch(`${BASE_URL}/${action}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Request-Headers": "*",
                "api-key": Deno.env.get("DB_API_KEY")
            },
            body: JSON.stringify({
                "collection": "User",
                "database": "AIBot",
                "dataSource": "Cluster0",
                ...data
            })
        })
        return await response.json()
    }

    return {exec}
}