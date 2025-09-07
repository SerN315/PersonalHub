import React, { useState, useEffect, useRef } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/weather.scss";
import WidgetProps from "@/app/types/widget";

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

// Weather condition to GIF mapping with randomization
const getWeatherBackground = (
  condition: string,
  previousCondition?: string,
  currentBackground?: string
): string => {
  const conditionLower = condition.toLowerCase();

  // If the condition hasn't changed, return the same background
  if (previousCondition === condition && currentBackground) {
    return currentBackground;
  }

  // Helper function to randomly select from an array
  const randomSelect = (options: string[]): string => {
    return options[Math.floor(Math.random() * options.length)];
  };

  // Sunny/Clear conditions - only one option available
  if (conditionLower.includes("sunny")) {
    return "/ImageforPH/sunnypixel-vmake.gif"; // Only one sunny file available
  }

  if (conditionLower.includes("clear")) {
    return "/ImageforPH/cuterelaxingontumbler_.gif"; // Only one clear file available
  }

  // Rainy conditions - only one option available
  if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle") ||
    conditionLower.includes("shower") ||
    conditionLower.includes("precipitation")
  ) {
    return "/ImageforPH/rain2.gif"; // Only one rain file available
  }

  // Snow conditions - 2 options available
  if (
    conditionLower.includes("snow") ||
    conditionLower.includes("blizzard") ||
    conditionLower.includes("flurries") ||
    conditionLower.includes("sleet")
  ) {
    return randomSelect([
      "/ImageforPH/snowing.gif",
      "/ImageforPH/snowing2.gif",
    ]);
  }

  // Thunderstorm conditions - 2 options available
  if (
    conditionLower.includes("thunder") ||
    conditionLower.includes("storm") ||
    conditionLower.includes("lightning")
  ) {
    return randomSelect([
      "/ImageforPH/thunderstorm.gif",
      "/ImageforPH/thunderstom2.webp",
    ]);
  }

  // Partly cloudy conditions - only one option available
  if (
    conditionLower.includes("partly cloudy") ||
    conditionLower.includes("partly sunny") ||
    conditionLower.includes("scattered clouds")
  ) {
    return "/ImageforPH/partlycloudy.gif";
  }

  // Cloudy/Overcast/Foggy conditions - 2 options available
  if (
    conditionLower.includes("cloudy") ||
    conditionLower.includes("overcast") ||
    conditionLower.includes("fog") ||
    conditionLower.includes("mist") ||
    conditionLower.includes("haze")
  ) {
    return randomSelect(["/ImageforPH/foggy.gif", "/ImageforPH/foggy 2.gif"]);
  }

  // Default fallback
  return "/ImageforPH/foggy 2.gif";
};

export default function WeatherWidget(props: WidgetProps) {
  const [weather, setWeather] = useState({
    location: "Your City",
    temperature: "--",
    condition: "Unknown",
  });

  // Store the previous condition and current background
  const previousCondition = useRef<string>("Unknown");
  const currentBackground = useRef<string>("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const days = 1;
        const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`;
        const forcastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${latitude},${longitude}&days=${days}`;
        try {
          const response = await fetch(url);
          const forecastResponse = await fetch(forcastUrl);
          const forecastData = await forecastResponse.json();
          const data = await response.json();
          console.log("Weather data:", data);
          console.log("Forecast:", forecastData);

          const newCondition = data.current.condition.text;

          // Get the background, considering if condition changed
          const background = getWeatherBackground(
            newCondition,
            previousCondition.current,
            currentBackground.current
          );

          // Update refs
          previousCondition.current = newCondition;
          currentBackground.current = background;

          setWeather({
            location: data.location.name,
            temperature: Math.round(data.current.temp_c).toString(),
            condition: newCondition,
          });
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
  }, []);

  return (
    <BaseWidget title="Weather" {...props}>
      <div
        className="weather__container"
        style={{
          backgroundImage: `url("${currentBackground.current}")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      >
        <div className="darken"></div>
        <div className="weather__location">{weather.location}</div>
        <div className="weather__temp">{weather.temperature}°C</div>
        <div className="weather__condition">{weather.condition}</div>
      </div>
    </BaseWidget>
  );
}
