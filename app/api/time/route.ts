export async function GET() {
  return Response.json({
    now: Date.now(),
    target: new Date("2026-05-12T12:15:00+02:00").getTime(),
  });
}