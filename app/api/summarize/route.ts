import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, maxTokens } = await req.json();
    
    // Ensure we have a valid prompt
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ API key not configured' },
        { status: 500 }
      );
    }

    // Make request to GROQ API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', 
        messages: [
          {
            role: 'system',
            content: `You are a news article summarizer that creates clear, concise, and objective summaries in Markdown format.
            
Follow these formatting rules exactly:
1. Use "# Key Points" as the main title followed by bullet points (use "-" for bullets)
2. Use "## Context" for the second section with a concise paragraph
3. Use "## Impact" for the third section with a concise paragraph
4. Use proper markdown syntax throughout (bold, italics, etc. where appropriate)
5. Keep the entire summary under 300 words for readability
6. Be factual and avoid opinion or speculation`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // Low temperature for more factual responses
        max_tokens: maxTokens || 500,   // Use provided max_tokens or default to 500
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 