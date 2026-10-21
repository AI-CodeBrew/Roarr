const body = { message: "Kluck Embed Api! 🚀", success: true };

export async function loader() {
    return Response.json(body, { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function action() {
    return Response.json(body, { status: 200, headers: { "Content-Type": "application/json" } });
}
