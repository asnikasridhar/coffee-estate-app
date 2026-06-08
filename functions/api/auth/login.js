export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const username = body.username || body.user_name;
    const password = body.password;

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    const user = await env.DB.prepare(
      `SELECT user_id, username, role
       FROM users
       WHERE username = ? AND password = ?
       LIMIT 1`
    ).bind(username, password).first();

    if (!user) {
      return Response.json({ error: "Invalid login" }, { status: 401 });
    }

    return Response.json({
      token: `demo-token-${user.user_id}`,
      user
    });
  } catch (err) {
    return Response.json(
      { error: "Login failed", details: err.message },
      { status: 500 }
    );
  }
}