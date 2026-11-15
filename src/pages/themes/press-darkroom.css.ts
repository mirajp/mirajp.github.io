import type { APIRoute } from "astro";
import pressDarkroomCss from "../../styles/theme-press-darkroom.css?inline";

export const GET: APIRoute = () =>
  new Response(pressDarkroomCss, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
