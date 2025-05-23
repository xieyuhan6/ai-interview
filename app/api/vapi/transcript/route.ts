let savedMessages: { role: string; content: string }[] = []

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 415, headers: { "Content-Type": "application/json" } }
      )
    }
    
    const body = await req.json()
    console.log("POST body:", body)
    
    const message = body.message
    if (
      !message ||
      typeof message.role !== "string" ||
      typeof message.content !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
    
    savedMessages.push(message)
    console.log("Saved messages:", savedMessages)
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in POST /api/vapi/transcript:", error)
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function GET() {
  try {
    return new Response(
      JSON.stringify({ messages: savedMessages }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in GET /api/vapi/transcript:", error)
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
