// GET: Màn hình LED và Admin lấy danh sách lời chúc khi mở trang hoặc F5
export async function onRequestGet(context) {
  try {
    // Lấy tối đa 100 lời chúc mới nhất từ Cloudflare D1
    const { results } = await context.env.DB.prepare(
      "SELECT id, idx as [index], name, message, timestamp as timeAgo FROM wishes ORDER BY idx DESC LIMIT 100"
    ).all();

    // Đảo ngược lại để xếp đúng thứ tự thời gian từ cũ đến mới
    const formatted = results.reverse();

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

// POST: Tiếp nhận lời chúc từ khách mời và lưu trữ bền vững vào Cloudflare D1
export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    
    // Tự động tính số thứ tự tiếp theo dựa trên tổng số dòng hiện có
    const countRes = await context.env.DB.prepare("SELECT COUNT(*) as total FROM wishes").first();
    const nextIndex = (countRes?.total || 0) + 1;

    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO wishes (id, idx, name, message, timestamp) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      data.id || `wish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nextIndex,
      data.name || "Anonymous",
      data.message || "",
      data.timeAgo || "Just now"
    ).run();

    return new Response(JSON.stringify({ status: "success", index: nextIndex }), {
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
