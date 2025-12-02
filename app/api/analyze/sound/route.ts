import { NextRequest, NextResponse } from "next/server"
export const runtime = "nodejs"
import { promises as fs } from "fs"
import path from "path"
import { spawn } from "child_process"

async function writeTempFile(file: File, prefix: string) {
  const buf = Buffer.from(await file.arrayBuffer())
  const dir = path.join(process.cwd(), "tmp_uploads")
  await fs.mkdir(dir, { recursive: true })
  const tmpPath = path.join(dir, `${prefix}_${Date.now()}_${file.name}`)
  await fs.writeFile(tmpPath, buf)
  return tmpPath
}

function runPython(scriptPath: string, payload: any): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const pythonExe = process.env.PYTHON_EXECUTABLE || "python"
  return new Promise((resolve) => {
    const child = spawn(pythonExe, [scriptPath], { cwd: process.cwd() })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d.toString()))
    child.stderr.on("data", (d) => (stderr += d.toString()))
    child.on("close", (code) => resolve({ stdout, stderr, code }))
    child.stdin.write(JSON.stringify(payload))
    child.stdin.end()
  })
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 })
    }

    const form = await request.formData()
    const file = form.get("sound") as File | null
    if (!file) {
      return NextResponse.json({ error: "Missing 'sound' file (.wav)" }, { status: 400 })
    }

    const tmpPath = await writeTempFile(file, "sound")

    const scriptPath = path.join(process.cwd(), "models", "predict_sound.py")
    const result = await runPython(scriptPath, { audio_path: tmpPath })

    // Clean up temp file
    try { await fs.unlink(tmpPath) } catch {}

    if (result.code !== 0 && !result.stdout) {
      return NextResponse.json({ error: "Inference failed", details: result.stderr }, { status: 500 })
    }

    let parsed: any
    try {
      parsed = JSON.parse(result.stdout.trim())
    } catch (e) {
      return NextResponse.json({ error: "Invalid script output", raw: result.stdout, stderr: result.stderr }, { status: 500 })
    }

    return NextResponse.json({ analysis: parsed })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unexpected error" }, { status: 500 })
  }
}
// Removed duplicated legacy block with conflicting imports and second POST handler.
