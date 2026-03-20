import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import Storytel from "storytel-api";

const STORYTEL_COOKIE_NAME = 'storytel_token';

export async function GET(req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const { bookId } = await params;

    if (!bookId) {
      return new NextResponse("Missing bookId", { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(STORYTEL_COOKIE_NAME)?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const storytel = new Storytel();
    const user = await storytel.signInUsingSingleSignToken(token);
    const bookshelf = await user.getBookshelf();
    
    const book = bookshelf.find((b: any) => b.id.toString() === bookId);
    if (!book) {
      return new NextResponse("Book not found", { status: 404 });
    }

    // Check if an audiobook format is available
    const abook = book.metadata?.abook || (book as any).abook;
    
    let streamUrl: string | null = null;
    if (abook && abook.id) {
       streamUrl = `https://www.storytel.com/mp3streamRangeReq?startposition=0&programId=${abook.id}&token=${token}`;
    } else {
       const details = await book.getBookDetails();
       console.log('[DEBUG] getBookDetails response:', JSON.stringify(details, null, 2));
       streamUrl = details?.audiobookSampleUrl ? details.audiobookSampleUrl.toString() : null;
    }

    if (!streamUrl) {
      return new NextResponse("No audio stream available", { status: 404 });
    }

    const rangeHeader = req.headers.get('range');
    const fetchHeaders: Record<string, string> = {};
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(streamUrl, { headers: fetchHeaders });
    if (!response.ok) {
       throw new Error(`Failed to fetch from Storytel: ${response.status} ${response.statusText}`);
    }

    const headers: Record<string, string> = {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    };
    
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      headers['Content-Range'] = contentRange;
    }

    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(response.body, { 
      status: response.status, // Forwards 206 Partial Content
      headers 
    });
  } catch (error) {
    console.error('[DEBUG] Audio Proxy Error:', error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
