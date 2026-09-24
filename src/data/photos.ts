import type { ImageMetadata } from "astro";

import kaiRaincoat from "../../assets/photos/kai_raincoat.jpg";
import wtcBeams from "../../assets/photos/wtc_beams.jpg";
import wtcPinkSunset from "../../assets/photos/wtc_pink_sunset.jpg";
import wtcStrawberryMoon1 from "../../assets/photos/wtc_strawberry_moon_1.jpg";
import wtcStrawberryMoon2 from "../../assets/photos/wtc_strawberry_moon_2.jpg";
import wtcSunrise from "../../assets/photos/wtc_sunrise.jpg";

export interface PhotoProps {
  src?: ImageMetadata;
  title?: string;
  caption?: string;
  isPlaceholder?: boolean;

  /** Controls the shape of the photo frame. */
  orientation?: "portrait" | "landscape";

  /** CSS object-position, e.g. "center", "50% 30%", "top". */
  objectPosition?: string;
}

export const photos: PhotoProps[] = [
  {
    title: "Wake up New York",
    caption: "Good morning, New Yorkers. ",
    src: wtcSunrise,
    orientation: "landscape",
    objectPosition: "0% 50%",
  },
  {
    title: "Google NYC",
    caption: "Rainy day",
    src: kaiRaincoat,
    orientation: "portrait",
    objectPosition: "50% 80%",
  },
  {
    title: "Strawberry Moon",
    caption: "You don't see that every day.",
    src: wtcStrawberryMoon1,
    orientation: "landscape",
    objectPosition: "0% 40%",
  },
  {
    title: "Strawberry Moon",
    caption: "No berries found, just a giant glowing orb.",
    src: wtcStrawberryMoon2,
    orientation: "landscape",
    objectPosition: "30% 50%",
  },
  {
    title: "Hudson River Greenway",
    caption: "February pinks",
    src: wtcPinkSunset,
    orientation: "landscape",
    objectPosition: "20% 50%",
  },
  {
    title: "Light in the Darkness",
    caption:
      "Shining bright as a symbol of remembrance and the unbroken spirit of a city.",
    src: wtcBeams,
    orientation: "landscape",
    objectPosition: "10% 10%",
  },
  {
    title: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
  {
    title: "???",
    caption: "Coming soon",
    isPlaceholder: true,
  },
];
