// GET: Màn hình LED và Admin lấy danh sách lời chúc khi mở trang hoặc F5
export async function onRequestGet(context) {
  try {
    // Lấy 100 lời chúc mới nhất từ Cloudflare D1 (bảng wishes_new)
    const { results } = await context.env.DB.prepare(
      "SELECT id, idx as [index], name, message, timestamp as timeAgo FROM wishes_new ORDER BY idx DESC LIMIT 100"
    ).all();

    const formatted = (results || []).reverse();

    return new Response(JSON.stringify({ status: "success", data: formatted }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    // Nếu hết quota đọc, trả về mảng rỗng để không sập trang, hệ thống sẽ dùng MQTT & LocalStorage
    return new Response(JSON.stringify({ status: "success", data: [], message: "Quota reached, fallback to realtime" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

// POST: Tiếp nhận lời chúc từ khách và lưu bền vững vào wishes_new
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const wishId = data.id || `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Chỉ thực thi INSERT (0 READ) -> Hoàn toàn không bị chặn bởi limit row read
    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO wishes_new (id, name, message, timestamp) VALUES (?, ?, ?, ?)"
    ).bind(
      wishId,
      data.name || "Anonymous",
      data.message || "",
      data.timeAgo || "Just now"
    ).run();

    return new Response(JSON.stringify({ 
      status: "success", 
      index: data.index || 1 
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
