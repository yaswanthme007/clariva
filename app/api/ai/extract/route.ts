import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { groq } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an invoice data extractor. Extract invoice information from the provided text and respond with ONLY a valid JSON object using these exact fields (use null for missing values):
{
  "invoice_number": string or null,
  "issue_date": "YYYY-MM-DD" or null,
  "due_date": "YYYY-MM-DD" or null,
  "amount": number or null,
  "currency": "USD" or 3-letter currency code or null,
  "client_name": string or null,
  "description": string or null,
  "line_items": [{"description": string, "qty": number, "unitPrice": number}]
}
Compute "amount" as the sum of all line items if items are provided. Always return valid JSON.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'

  try {
    const extracted = JSON.parse(raw)
    return NextResponse.json({ extracted })
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
