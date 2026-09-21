// GET: Màn hình LED và Admin lấy danh sách lời chúc khi mở trang hoặc F5
export async function onRequestGet(context) {
  try {
    // Lấy 100 lời chúc mới nhất từ Cloudflare D1
    const { results } = await context.env.DB.prepare(
      "SELECT id, idx as [index], name, message, timestamp as timeAgo FROM wishes ORDER BY idx DESC LIMIT 100"
    ).all();

    // Đảo ngược lại để xếp đúng thứ tự thời gian từ cũ đến mới (1 -> N)
    const formatted = (results || []).reverse();

    return new Response(JSON.stringify({ status: "success", data: formatted }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// POST: Tiếp nhận lời chúc từ khách và lưu bền vững vào Cloudflare D1
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const wishId = data.id || `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // KHÔNG CẦN SELECT COUNT(*) NỮA. SQLite tự cấp phát idx qua AUTOINCREMENT
    const res = await context.env.DB.prepare(
      "INSERT OR IGNORE INTO wishes (id, name, message, timestamp) VALUES (?, ?, ?, ?) RETURNING idx"
    ).bind(
      wishId,
      data.name || "Anonymous",
      data.message || "",
      data.timeAgo || "Just now"
    ).first();

    return new Response(JSON.stringify({ 
      status: "success", 
      index: res?.idx || data.index || 1 
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
