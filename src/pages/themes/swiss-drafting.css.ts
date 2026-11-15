import type { APIRoute } from "astro";
import swissDraftingCss from "../../styles/theme-swiss-drafting.css?inline";

export const GET: APIRoute = () =>
  new Response(swissDraftingCss, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
