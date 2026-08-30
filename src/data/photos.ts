import type { ImageMetadata } from "astro";

import kaiRaincoat from "../../assets/photos/kai_raincoat.jpg";
import wtcPinkSunset from "../../assets/photos/wtc_pink_sunset.jpg";

export interface PhotoProps {
  src?: ImageMetadata;
  place?: string;
  caption?: string;
  isPlaceholder?: boolean;

  /** Controls the shape of the photo frame. */
  orientation?: "portrait" | "landscape";

  /** CSS object-position, e.g. "center", "50% 30%", "top". */
  objectPosition?: string;
}

export const photos: PhotoProps[] = [
  {
    place: "Google NYC",
    caption: "Rainy day",
    src: kaiRaincoat,
    orientation: "portrait",
    objectPosition: "50% 80%",
  },
  {
    place: "Pier 57",
    caption: "February pinks",
    src: wtcPinkSunset,
    orientation: "landscape",
    objectPosition: "20% 50%",
  },
  {
    place: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
  {
    place: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
  {
    place: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
  {
    place: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
  {
    place: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
];
