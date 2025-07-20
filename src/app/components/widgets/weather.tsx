import React, { useState, useEffect } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/weather.scss";
import WidgetProps from "@/app/types/widget";

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
console.log("Weather API Key:", API_KEY);

export default function WeatherWidget(props: WidgetProps) {
  const [weather, setWeather] = useState({
    location: "Your City",
    temperature: "--",
    condition: "Unknown",
  });

  useEffect(() => {
    // Get user's geolocation
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`;

        try {
          const response = await fetch(url);
          const data = await response.json();
          console.log("Weather data:", data);

          setWeather({
            location: data.location.name,
            temperature: Math.round(data.current.temp_c).toString(),
            condition: data.current.condition.text,
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
      <div className="weather__container">
        <div className="weather__location">{weather.location}</div>
        <div className="weather__temp">{weather.temperature}°C</div>
        <div className="weather__condition">{weather.condition}</div>
      </div>
    </BaseWidget>
  );
}
