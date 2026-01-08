/**
 * Image Upload API Route
 * 
 * Uploads images to Supabase Storage and returns a public URL.
 * This is more efficient than sending base64 encoded images in API requests.
 * 
 * Uses the Resolve Supabase project for storage (same as the troubleshooting API).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Resolve project Supabase configuration (same project as the troubleshooting API)
// This is a public anon key, safe to embed
const RESOLVE_SUPABASE_URL = 'https://mecgxrlfinjcwhsdjoce.supabase.co';
const RESOLVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lY2d4cmxmaW5qY3doc2Rqb2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjE5OTUsImV4cCI6MjA3OTkzNzk5NX0.Uk1BVs7aUyKzNFtzHGPJ1qkTEvtCymJsMAXhxL4b3xg';

// Create a Supabase client for the Resolve project storage
const getStorageClient = () => {
  return createClient(RESOLVE_SUPABASE_URL, RESOLVE_SUPABASE_ANON_KEY);
};

const BUCKET_NAME = 'troubleshoot-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image must be less than 10MB' },
        { status: 400 }
      );
    }
    
    const supabase = getStorageClient();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomId}.${extension}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
    
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

