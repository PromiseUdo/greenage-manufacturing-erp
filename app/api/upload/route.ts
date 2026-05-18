import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { dataUrl, folder = 'greenage', publicId } = body as {
    dataUrl: string;
    folder?: string;
    publicId?: string;
  };

  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
  }

  // Validate MIME type
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mime = mimeMatch?.[1] ?? '';
  if (!ALLOWED_TYPES.includes(mime)) {
    return NextResponse.json(
      { error: `Unsupported file type "${mime}". Use JPEG, PNG, or WebP.` },
      { status: 400 },
    );
  }

  // Validate file size from base64 length
  const base64Data = dataUrl.split(',')[1] ?? '';
  const bytes = Math.ceil((base64Data.length * 3) / 4);
  if (bytes > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image must be smaller than 5 MB.' },
      { status: 400 },
    );
  }

  try {
    const uploadOptions: Record<string, unknown> = {
      folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    };

    // If replacing an existing image, overwrite using its public_id
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true;
    }

    const result = await cloudinary.uploader.upload(dataUrl, uploadOptions);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return NextResponse.json(
      { error: 'Image upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
