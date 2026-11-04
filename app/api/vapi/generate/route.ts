export function GET() {
  return Response.json(
    {
      error:
        "This legacy endpoint has been retired. Use the authenticated /api/helper endpoint.",
    },
    { status: 410 },
  );
}
export const POST = GET;
