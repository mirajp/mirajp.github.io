import type { ImageMetadata } from "astro";

import empireStateAndEyeOfSauron from "../../assets/photos/empire_state_and_eye_of_sauron.jpg";
import empireStateHaze from "../../assets/photos/empire_state_haze.jpg";
import kaiRaincoat from "../../assets/photos/kai_raincoat.jpg";
import sfSkyline from "../../assets/photos/sf_skyline.jpg";
import sfTransamericaPyramid from "../../assets/photos/sf_transamerica_pyramid.jpg";
import wtcBaskInTheGlow from "../../assets/photos/wtc_bask_in_the_glow.jpg";
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
    title: "Wake up, New York",
    caption: "Good morning, New Yorkers. ",
    src: wtcSunrise,
    orientation: "landscape",
    objectPosition: "0% 50%",
  },
  {
    title: "Google NYC Rooftop",
    caption: "Rain or shine, the in-office mandate stands.",
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
    title: "Pointy Building, Soft Flowers",
    caption: "The concrete jungle of the west coast.",
    src: sfTransamericaPyramid,
    orientation: "portrait",
    objectPosition: "0% 0%",
  },
  {
    title: "SF From The Clouds",
    caption: "Karl the Fog must be on vacation.",
    src: sfSkyline,
    orientation: "portrait",
    objectPosition: "0% 50%",
  },
  {
    title: "Morning Haze",
    caption: "I guess there are two golden hours.",
    src: empireStateHaze,
    orientation: "portrait",
    objectPosition: "0% 50%",
  },
  {
    title: "Primary Choices",
    caption: "Pick your favorite primary color and enjoy the view.",
    src: wtcBaskInTheGlow,
    orientation: "portrait",
    objectPosition: "0% 50%",
  },
  {
    title: "Big Lights Will Inspire You",
    caption:
      "The village is aglow, kaleidoscope of loud heartbeats under coats.",
    src: empireStateAndEyeOfSauron,
    orientation: "portrait",
    objectPosition: "0% 50%",
  },
  {
    title: "February Pinks",
    caption:
      "A beautiful sunset to warm you up when the weather outside is frightful.",
    src: wtcPinkSunset,
    orientation: "landscape",
    objectPosition: "20% 50%",
  },
  {
    title: "Light in the Darkness",
    caption: "A symbol of the unbroken spirit of a city.",
    src: wtcBeams,
    orientation: "landscape",
    objectPosition: "10% 10%",
  },
];
