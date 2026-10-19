/**
 * Weather condition mappings for WeatherAPI
 * Maps WeatherAPI conditions to a line icon and a background GIF
 */

// Interface for background GIF options
interface BackgroundMapping {
  options: string[];
}

/**
 * Maps weather condition keywords to background GIF options
 */
export const WEATHER_BACKGROUND_MAP: Record<string, BackgroundMapping> = {
  sunny: { options: ["/ImageforPH/sunnypixel-vmake.gif"] },
  clear: { options: ["/ImageforPH/cuterelaxingontumbler_.gif"] },
  rain: { options: ["/ImageforPH/rain2.gif"] },
  snow: {
    options: ["/ImageforPH/snowing.gif", "/ImageforPH/snowing2.gif"],
  },
  thunder: {
    options: ["/ImageforPH/thunderstorm.gif", "/ImageforPH/thunderstom2.webp"],
  },
  partlyCloudy: { options: ["/ImageforPH/partlycloudy.gif"] },
  cloudy: { options: ["/ImageforPH/foggy.gif", "/ImageforPH/foggy2.gif"] },
};

/**
 * Get a random background GIF based on weather condition
 * @param condition - Weather condition text from API
 * @param previousCondition - Previous condition to check if changed
 * @param currentBackground - Current background URL
 * @returns Path to the background GIF/WebP file
 */
export const getWeatherBackground = (
  condition: string,
  previousCondition?: string,
  currentBackground?: string
): string => {
  const conditionLower = condition.toLowerCase();

  // If condition hasn't changed, return the same background
  if (previousCondition === condition && currentBackground) {
    return currentBackground;
  }

  // Helper to randomly select from an array
  const randomSelect = (options: string[]): string => {
    return options[Math.floor(Math.random() * options.length)];
  };

  // Match condition to background
  if (conditionLower.includes("sunny")) {
    return randomSelect(WEATHER_BACKGROUND_MAP.sunny.options);
  }

  if (conditionLower.includes("clear")) {
    return randomSelect(WEATHER_BACKGROUND_MAP.clear.options);
  }

  if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle") ||
    conditionLower.includes("shower") ||
    conditionLower.includes("precipitation")
  ) {
    return randomSelect(WEATHER_BACKGROUND_MAP.rain.options);
  }

  if (
    conditionLower.includes("snow") ||
    conditionLower.includes("blizzard") ||
    conditionLower.includes("flurries") ||
    conditionLower.includes("sleet")
  ) {
    return randomSelect(WEATHER_BACKGROUND_MAP.snow.options);
  }

  if (
    conditionLower.includes("thunder") ||
    conditionLower.includes("storm") ||
    conditionLower.includes("lightning")
  ) {
    return randomSelect(WEATHER_BACKGROUND_MAP.thunder.options);
  }

  if (
    conditionLower.includes("partly cloudy") ||
    conditionLower.includes("partly sunny") ||
    conditionLower.includes("scattered clouds")
  ) {
    return randomSelect(WEATHER_BACKGROUND_MAP.partlyCloudy.options);
  }

  if (
    conditionLower.includes("cloudy") ||
    conditionLower.includes("overcast") ||
    conditionLower.includes("fog") ||
    conditionLower.includes("mist") ||
    conditionLower.includes("haze")
  ) {
    return randomSelect(WEATHER_BACKGROUND_MAP.cloudy.options);
  }

  // Default fallback
  return "/ImageforPH/foggy2.gif";
};

type Pair = readonly [day: string, night: string];

const group = (icon: Pair, codes: number[]): [number, Pair][] => codes.map((code) => [code, icon]);

// WeatherAPI condition code -> [day icon, night icon] (names from @hugeicons/core-free-icons).
const ICONS = new Map<number, Pair>([
  ...group(["Sun03Icon", "Moon02Icon"], [1000]),
  ...group(["SunCloud01Icon", "MoonCloudIcon"], [1003]),
  ...group(["CloudIcon", "CloudIcon"], [1006, 1009]),
  ...group(["CloudSlowWindIcon", "CloudSlowWindIcon"], [1030, 1135, 1147]),
  ...group(["SunCloudLittleRainIcon", "MoonCloudLittleRainIcon"], [1063, 1150, 1153, 1180, 1183, 1240]),
  ...group(["CloudMidRainIcon", "CloudMidRainIcon"], [1186, 1189, 1243]),
  ...group(["CloudBigRainIcon", "CloudBigRainIcon"], [1192, 1195, 1246]),
  ...group(["CloudLittleSnowIcon", "CloudLittleSnowIcon"], [1066, 1210, 1213, 1255]),
  ...group(["CloudMidSnowIcon", "CloudMidSnowIcon"], [1216, 1219, 1258]),
  ...group(["CloudSnowIcon", "CloudSnowIcon"], [1114, 1117, 1222, 1225]),
  ...group(["CloudHailstoneIcon", "CloudHailstoneIcon"], [1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264]),
  ...group(["CloudAngledRainZapIcon", "CloudAngledRainZapIcon"], [1087, 1273, 1276]),
  ...group(["CloudAngledZapIcon", "CloudAngledZapIcon"], [1279, 1282]),
]);

/**
 * The line icon (a @hugeicons name) for a WeatherAPI condition.
 * @param code - WeatherAPI condition code
 * @param isDay - 1 for day, 0 for night
 */
export const getWeatherIconName = (code: number | undefined, isDay: number | undefined) => {
  const pair = code === undefined ? undefined : ICONS.get(code);
  if (!pair) return "CloudIcon";
  return isDay === 0 ? pair[1] : pair[0];
};
