// GET: Màn hình LED và Admin lấy toàn bộ danh sách khi mở trang hoặc F5
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT id, idx as [index], name, message, timestamp as timeAgo FROM wishes ORDER BY idx ASC"
    ).all();

    return new Response(JSON.stringify({ status: "success", data: results }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500 });
  }
}

// POST: Hấp thụ hàng nghìn lời chúc đồng thời từ khách mời
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    
    // Ghi tức thì vào SQL D1
    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO wishes (id, idx, name, message, timestamp) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      data.id,
      data.index || 1,
      data.name,
      data.message,
      data.timeAgo || "Just now"
    ).run();

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500 });
  }
}
