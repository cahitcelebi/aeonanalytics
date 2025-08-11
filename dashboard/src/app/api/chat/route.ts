import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Backend'e istek gönder
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        type: 'error',
        message: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Backend'e history temizleme isteği gönder
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/chat/history`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat history clear error:', error);
    return NextResponse.json(
      { error: 'History temizleme hatası' },
      { status: 500 }
    );
  }
} 