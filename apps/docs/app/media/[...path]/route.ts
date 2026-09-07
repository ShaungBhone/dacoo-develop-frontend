import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextResponse } from "next/server"

const assetRoot = path.resolve(process.cwd(), "content/assets")
const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path
  const requestedPath = path.resolve(assetRoot, ...segments)
  if (!requestedPath.startsWith(`${assetRoot}${path.sep}`)) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const body = await readFile(requestedPath)
    const contentType = contentTypes[path.extname(requestedPath).toLowerCase()]
    if (!contentType) return new NextResponse("Not found", { status: 404 })
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}
