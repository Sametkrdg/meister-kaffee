/**
 * head.js — GET handler'ından HEAD handler'ı üretir.
 *
 * Pages Functions'ta yalnızca onRequestGet tanımlı bir route'a gelen HEAD
 * isteği statik varlıklara düşer ve 404 döner. Uptime izleme servisleri ve
 * bazı botlar HEAD kullandığı için site kapalı görünür. Yanıt GET ile
 * birebir aynı üretilir (durum kodu + header'lar), yalnızca gövde atılır.
 */
export function headFromGet(onRequestGet) {
  return async (context) => {
    const response = await onRequestGet(context);
    return new Response(null, response);
  };
}
