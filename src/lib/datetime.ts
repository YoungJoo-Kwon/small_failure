// 서울 시간대 표기 도우미
export function formatKST(ts?: any) {
  // ts는 Firestore Timestamp | Date | number | undefined
  let date: Date | null = null;

  if (!ts) return "방금";
  if (typeof ts?.toDate === "function") date = ts.toDate(); // Firestore Timestamp
  else if (ts instanceof Date) date = ts;
  else if (typeof ts === "number") date = new Date(ts);

  if (!date) return "방금";

  // Asia/Seoul 기준, "YYYY-MM-DD HH:mm" 느낌
  const datePart = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);

  const timePart = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).format(date);

  // ko-KR 포맷이 "2025. 09. 13." 처럼 나와서 보기 좋게 다듬기
  const normDate = datePart.replace(/\.\s?/g, "-").replace(/-$/,""); // "2025-09-13"
  return `${normDate} ${timePart}`; // "2025-09-13 14:05"
}
