export async function onRequest(context: { request: Request }) {
	const url = new URL(context.request.url);
	const userId = url.searchParams.get("userId") || "mengku";

	try {
		const res = await fetch(
			`https://api.bgm.tv/v0/users/${userId}/collections?subject_type=2&limit=50`,
			{
				headers: {
					"User-Agent": "MengkuBlog/1.0 (https://github.com/mengkuikun/Blog)",
				},
			},
		);

		const data = await res.text();
		return new Response(data, {
			status: res.status,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=60",
			},
		});
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}
}
