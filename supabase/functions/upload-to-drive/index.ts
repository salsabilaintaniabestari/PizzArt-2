import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOOGLE_DRIVE_FOLDER_ID = "11AQVqilWrrNUTWvOimzklSh958-Hr1db";
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
const GOOGLE_PRIVATE_KEY = Deno.env.get("GOOGLE_PRIVATE_KEY");

if (!GOOGLE_API_KEY || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.error("Missing required Google Drive environment variables");
}

interface UploadRequest {
  file: string;
  fileName: string;
  mimeType: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

async function getAccessToken(): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"));

  const importedKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    importedKey,
    encoder.encode(signatureInput)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureEncoded = btoa(String.fromCharCode.apply(null, signatureArray as any));

  const jwt = `${signatureInput}.${signatureEncoded}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData: TokenResponse = await tokenResponse.json();
  return tokenData.access_token;
}

async function uploadFileToDrive(
  fileContent: Uint8Array,
  fileName: string,
  mimeType: string,
  accessToken: string
): Promise<{ fileId: string; publicUrl: string }> {
  const metadata = {
    name: fileName,
    parents: [GOOGLE_DRIVE_FOLDER_ID],
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", new Blob([fileContent], { type: mimeType }), fileName);

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json();
    throw new Error(`Upload failed: ${errorData.error?.message || "Unknown error"}`);
  }

  const uploadData = await uploadResponse.json();
  const fileId = uploadData.id;

  const publicUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800?authuser=0`;

  return { fileId, publicUrl };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { file, fileName, mimeType }: UploadRequest = await req.json();

    if (!file || !fileName || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file, fileName, mimeType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fileContent = Uint8Array.from(atob(file), (c) => c.charCodeAt(0));

    const accessToken = await getAccessToken();
    const { fileId, publicUrl } = await uploadFileToDrive(
      fileContent,
      fileName,
      mimeType,
      accessToken
    );

    return new Response(
      JSON.stringify({
        success: true,
        fileId,
        publicUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Upload failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
