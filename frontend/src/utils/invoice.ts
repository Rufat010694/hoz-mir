import { Order } from "@/types";

export function printInvoice(order: Order, user: { store_name?: string | null; full_name?: string | null; username?: string; iin?: string | null }) {
  const seller = user.store_name || user.full_name || user.username || "—";
  const sellerIIN = user.iin || "_______________";
  const docNum = (order as any).order_number ?? order.id;
  const docDate = new Date(order.created_at).toLocaleDateString("ru-KZ");
  const buyer = [order.client_name, order.client_store].filter(Boolean).join(", ") || "—";
  const buyerPhone = order.client_phone || "—";

  const rows = order.items.map((item, i) => {
    const price = Number(item.price);
    const subtotal = Number(item.subtotal);
    return `
    <tr>
      <td style="border:1px solid #000;padding:4px;text-align:center">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px">${item.product_name}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center"></td>
      <td style="border:1px solid #000;padding:4px;text-align:center">шт</td>
      <td style="border:1px solid #000;padding:4px;text-align:center">${item.quantity}</td>
      <td style="border:1px solid #000;padding:4px;text-align:center">${item.quantity}</td>
      <td style="border:1px solid #000;padding:4px;text-align:right">${price.toFixed(2)}</td>
      <td style="border:1px solid #000;padding:4px;text-align:right">${subtotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Накладная №${docNum}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#000;margin:10mm 15mm}
  h2{font-size:14px;font-weight:bold;text-align:center;margin:8px 0}
  .ref{font-size:9px;text-align:right;margin-bottom:4px}
  .header-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
  .org-box{border:1px solid #000;padding:6px;min-height:60px}
  .org-label{font-size:9px;margin-bottom:4px}
  .meta-row{display:flex;gap:16px;margin-bottom:6px;align-items:flex-end;justify-content:center}
  .meta-field{border-bottom:1px solid #000;min-width:80px;display:inline-block}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th{border:1px solid #000;padding:4px;text-align:center;font-size:10px;background:#f5f5f5}
  .sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .sig-line{border-top:1px solid #000;margin-top:20px;font-size:9px;text-align:center}
  @media print{@page{margin:10mm 15mm}body{margin:0}}
</style></head><body>
<div class="ref">к приказу Министерства финансов Республики Казахстан от 20 декабря 2012 года №562 &nbsp;|&nbsp; Форма 3-2</div>
<div class="header-grid">
  <div>
    <div class="org-box">
      <div class="org-label">Организация (индивидуальный предприниматель) — отправитель:</div>
      <strong>${seller}</strong><br/>
      ИИН/БИН: <span class="meta-field">${sellerIIN}</span>
    </div>
  </div>
  <div>
    <div style="text-align:center">
      <h2>НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</h2>
      <div class="meta-row"><span>БИН/ИИН: <span class="meta-field" style="min-width:120px">${sellerIIN}</span></span></div>
      <div class="meta-row">
        <span>Номер <span class="meta-field" style="min-width:60px">${docNum}</span></span>
        <span>Дата <span class="meta-field" style="min-width:80px">${docDate}</span></span>
      </div>
    </div>
    <div class="org-box" style="margin-top:4px">
      <div class="org-label">Организация (индивидуальный предприниматель) — получатель:</div>
      <strong>${buyer}</strong><br/>
      Тел: ${buyerPhone}
    </div>
  </div>
</div>
<div style="font-size:9px;margin-bottom:4px">Товарно-транспортная организация: <span class="meta-field" style="min-width:200px"></span></div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:30px">№</th>
      <th rowspan="2">Наименование, характеристика</th>
      <th rowspan="2" style="width:30px">№</th>
      <th rowspan="2" style="width:40px">Единица изм.</th>
      <th colspan="2">Количество</th>
      <th rowspan="2" style="width:80px">Цена, ₸</th>
      <th rowspan="2" style="width:90px">Сумма, ₸</th>
    </tr>
    <tr>
      <th style="width:55px">Подлежит отпуску</th>
      <th style="width:55px">Отпущено</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="7" style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold">ИТОГО:</td>
      <td style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold">${Number(order.total_amount).toFixed(2)}</td>
    </tr>
  </tfoot>
</table>
<div class="sig">
  <div><p>Ответственный за поставку (Ф.И.О.):</p><div class="sig-line">${seller}</div></div>
  <div><p>Груз принял (Ф.И.О.):</p><div class="sig-line">${buyer}</div></div>
</div>
${order.comment ? `<p style="font-size:10px;margin-top:8px">Примечание: ${order.comment}</p>` : ""}
</body></html>`;

  // Download as HTML file — works on all browsers, no popup blockers
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nakladnaya-${docNum}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
