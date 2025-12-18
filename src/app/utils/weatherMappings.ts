/**
 * Weather condition mappings for WeatherAPI
 * Maps condition codes to appropriate icons and background GIFs
 */

// Interface for icon mapping
interface IconMapping {
  day: string;
  night: string;
}

// Interface for background GIF options
interface BackgroundMapping {
  options: string[];
}

/**
 * Maps WeatherAPI condition codes to local PNG icons
 * Reference: https://www.weatherapi.com/docs/weather_conditions.json
 */
export const WEATHER_ICON_MAP: Record<number, IconMapping> = {
  1000: { day: "/png/008-sun.png", night: "/png/027-night.png" }, // Sunny / Clear
  1003: { day: "/png/009-breezy.png", night: "/png/017-cloudy-night.png" }, // Partly cloudy
  1006: { day: "/png/014-haze.png", night: "/png/014-haze.png" }, // Cloudy
  1009: { day: "/png/014-haze.png", night: "/png/014-haze.png" }, // Overcast
  1030: { day: "/png/015-mist.png", night: "/png/021-misty.png" }, // Mist
  1063: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Patchy rain possible
  1066: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Patchy snow possible
  1069: { day: "/png/022-sleet.png", night: "/png/022-sleet.png" }, // Patchy sleet possible
  1072: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Patchy freezing drizzle possible
  1087: { day: "/png/040-thunder.png", night: "/png/040-thunder.png" }, // Thundery outbreaks possible
  1114: { day: "/png/035-wind.png", night: "/png/048-wind-1.png" }, // Blowing snow
  1117: { day: "/png/044-snow-storm.png", night: "/png/044-snow-storm.png" }, // Blizzard
  1135: { day: "/png/014-haze.png", night: "/png/021-misty.png" }, // Fog
  1147: { day: "/png/014-haze.png", night: "/png/021-misty.png" }, // Freezing fog
  1150: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Patchy light drizzle
  1153: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Light drizzle
  1168: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Freezing drizzle
  1171: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Heavy freezing drizzle
  1180: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Patchy light rain
  1183: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Light rain
  1186: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Moderate rain at times
  1189: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Moderate rain
  1192: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Heavy rain at times
  1195: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Heavy rain
  1198: { day: "/png/047-drizzle.png", night: "/png/047-drizzle.png" }, // Light freezing rain
  1201: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Moderate or heavy freezing rain
  1204: { day: "/png/022-sleet.png", night: "/png/022-sleet.png" }, // Light sleet
  1207: { day: "/png/022-sleet.png", night: "/png/022-sleet.png" }, // Moderate or heavy sleet
  1210: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Patchy light snow
  1213: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Light snow
  1216: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Patchy moderate snow
  1219: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Moderate snow
  1222: { day: "/png/028-winter.png", night: "/png/028-winter.png" }, // Patchy heavy snow
  1225: { day: "/png/028-winter.png", night: "/png/028-winter.png" }, // Heavy snow
  1237: { day: "/png/037-stalactite.png", night: "/png/037-stalactite.png" }, // Ice pellets
  1240: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Light rain shower
  1243: { day: "/png/011-rain.png", night: "/png/011-rain.png" }, // Moderate or heavy rain shower
  1246: { day: "/png/010-flood.png", night: "/png/010-flood.png" }, // Torrential rain shower
  1249: { day: "/png/022-sleet.png", night: "/png/022-sleet.png" }, // Light sleet showers
  1252: { day: "/png/022-sleet.png", night: "/png/022-sleet.png" }, // Moderate or heavy sleet showers
  1255: { day: "/png/006-snowflake.png", night: "/png/006-snowflake.png" }, // Light snow showers
  1258: { day: "/png/028-winter.png", night: "/png/028-winter.png" }, // Moderate or heavy snow showers
  1261: { day: "/png/037-stalactite.png", night: "/png/037-stalactite.png" }, // Light showers of ice pellets
  1264: { day: "/png/037-stalactite.png", night: "/png/037-stalactite.png" }, // Moderate or heavy showers of ice pellets
  1273: { day: "/png/040-thunder.png", night: "/png/040-thunder.png" }, // Patchy light rain with thunder
  1276: { day: "/png/040-thunder.png", night: "/png/040-thunder.png" }, // Moderate or heavy rain with thunder
  1279: {
    day: "/png/007-lightning-bolt.png",
    night: "/png/007-lightning-bolt.png",
  }, // Patchy light snow with thunder
  1282: {
    day: "/png/007-lightning-bolt.png",
    night: "/png/007-lightning-bolt.png",
  }, // Moderate or heavy snow with thunder
};

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
  cloudy: { options: ["/ImageforPH/foggy.gif", "/ImageforPH/foggy 2.gif"] },
};

/**
 * Get the appropriate icon for a weather condition
 * @param code - WeatherAPI condition code
 * @param isDay - 1 for day, 0 for night
 * @returns Path to the icon PNG file
 */
export const getWeatherIcon = (code: number, isDay: number): string => {
  const icons = WEATHER_ICON_MAP[code];
  if (icons) {
    return isDay ? icons.day : icons.night;
  }
  // Fallback to weather forecast icon if code not found
  return "/png/003-weather-forecast.png";
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
  return "/ImageforPH/foggy 2.gif";
};
