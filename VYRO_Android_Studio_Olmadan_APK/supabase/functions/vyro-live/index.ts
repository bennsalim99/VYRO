

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { AccessToken } from "npm:livekit-server-sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL")!;
const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY")!;
const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  try {
    if (req.method !== "POST") {
      return json({ error: "POST gerekli." }, 405);
    }

    if (
      !LIVEKIT_URL ||
      !LIVEKIT_API_KEY ||
      !LIVEKIT_API_SECRET ||
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY
    ) {
      return json({ error: "Sunucu ayarları eksik." }, 500);
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Oturum açmanız gerekiyor." }, 401);
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: authorization },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return json({ error: "Geçersiz kullanıcı oturumu." }, 401);
    }

    const body = await req.json();
    const roomName = String(body.room || "").trim();

    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(roomName)) {
      return json({ error: "Geçersiz yayın odası." }, 400);
    }

    const token = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity: user.id,
        ttl: "1h",
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return json({
      success: true,
      token: jwt,
      serverUrl: LIVEKIT_URL,
      room: roomName,
      identity: user.id,
    });
  } catch (error) {
    console.error("VYRO LIVE ERROR:", error);
    return json({ error: "Canlı yayın bağlantısı oluşturulamadı." }, 500);
  }
});
