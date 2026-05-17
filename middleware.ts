import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/public-env";

/**
 * Refresca la sesión de Supabase en (casi) cada petición para que las cookies
 * sigan válidas en el cliente (evita que parezca que no estás logueado).
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  let supabaseUrl: string;
  let supabaseAnonKey: string;
  try {
    ({ url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicConfig());
  } catch (e) {
    console.error("[middleware]", e);
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
      let isAdmin = false;
      const { data: viaRpc, error: rpcErr } = await supabase.rpc("am_i_tournament_admin");
      if (!rpcErr && typeof viaRpc === "boolean") {
        isAdmin = viaRpc;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = !!profile?.is_admin;
      }
      if (!isAdmin) {
        const denied = request.nextUrl.clone();
        denied.pathname = "/dashboard";
        denied.searchParams.set("admin", "denegado");
        return NextResponse.redirect(denied);
      }
    }

    return response;
  } catch (err) {
    console.error("[middleware]", err);
    // Evita 500 MIDDLEWARE_INVOCATION_FAILED en Edge; la app carga sin refresco de sesión en esta petición.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
