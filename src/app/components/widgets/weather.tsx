/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/weather.scss";
import WidgetProps from "@/app/types/widget";
import Image from "next/image";
import {
  getWeatherIcon,
  getWeatherBackground,
} from "@/app/utils/weatherMappings";

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

export default function WeatherWidget(props: WidgetProps) {
  const [weather, setWeather] = useState({
    location: "Your City",
    temperature: "--",
    condition: "Unknown",
  });

  // Add state for hourly forecast
  const [hourly, setHourly] = useState<any[]>([]);
  const forecastListRef = useRef<HTMLDivElement>(null);

  // Track if parent is at max height
  const containerRef = useRef<HTMLDivElement>(null);
  const [showForecast, setShowForecast] = useState(true);

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
          // Set hourly forecast (first day)
          if (
            forecastData &&
            forecastData.forecast &&
            forecastData.forecast.forecastday &&
            forecastData.forecast.forecastday[0] &&
            forecastData.forecast.forecastday[0].hour
          ) {
            setHourly(forecastData.forecast.forecastday[0].hour);
          }
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
    // Check for compact mode based on props or window size
  }, []);

  // Group hourly data into pages and calculate navigation
  const [hourlyPages, setHourlyPages] = useState<any[][]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Initialize pages when hourly data is available
  useEffect(() => {
    if (hourly.length === 0) return;

    // Calculate items per view based on container width
    const calculateItemsPerView = () => {
      if (!containerRef.current) return 3;
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth < 300) return 2;
      if (containerWidth < 500) return 3;
      if (containerWidth < 700) return 4;
      return 5;
    };

    const itemsPerPage = calculateItemsPerView();

    // Group hourly data into pages
    const pages: { time: string; temp: number; icon: string }[][] = [];
    for (let i = 0; i < hourly.length; i += itemsPerPage) {
      pages.push(hourly.slice(i, i + itemsPerPage));
    }
    setHourlyPages(pages);

    // Find which page contains the current hour
    const now = new Date();
    const currentHour = now.getHours();
    let currentHourIdx = hourly.findIndex(
      (h) => new Date(h.time).getHours() >= currentHour
    );
    if (currentHourIdx === -1) currentHourIdx = 0;

    // Calculate which page the current hour is in
    const currentPage = Math.floor(currentHourIdx / itemsPerPage);
    setCurrentPageIndex(currentPage);
  }, [hourly]);

  // Memoized carousel navigation functions for pages
  const nextPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.min(prev + 1, hourlyPages.length - 1));
  }, [hourlyPages.length]);

  const prevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Check if navigation buttons should be shown
  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < hourlyPages.length - 1;

  useEffect(() => {
    if (
      !forecastListRef.current ||
      !containerRef.current ||
      hourly.length === 0
    )
      return;

    const el = forecastListRef.current;
    const container = containerRef.current;

    // Calculate items per view based on container width
    const calculateItemsPerView = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth < 300) return 1;
      if (containerWidth < 500) return 2;
      if (containerWidth < 700) return 3;
      return 4;
    };

    // Recalculate pages based on new container size
    const recalculatePages = () => {
      const newItemsPerPage = calculateItemsPerView();

      // Group hourly data into new pages
      const newPages: { time: string; temp: number; icon: string }[][] = [];
      for (let i = 0; i < hourly.length; i += newItemsPerPage) {
        newPages.push(hourly.slice(i, i + newItemsPerPage));
      }
      setHourlyPages(newPages);

      // Adjust current page if needed to stay within bounds
      setCurrentPageIndex((prev) =>
        Math.min(prev, Math.max(0, newPages.length - 1))
      );
    };

    const checkHeightAndResize = () => {
      // Check if forecast should show (height check)
      const isNotOverflowing = el.scrollHeight <= el.clientHeight + 2;
      setShowForecast(isNotOverflowing);

      // Recalculate pages on resize
      recalculatePages();
    };

    // Initial check
    checkHeightAndResize();

    // Observe size changes on both forecast container and main container
    const resizeObserver = new window.ResizeObserver(checkHeightAndResize);
    resizeObserver.observe(el);
    resizeObserver.observe(container);

    // Also observe parent in case its size changes
    if (el.parentElement) {
      resizeObserver.observe(el.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [hourly, currentPageIndex]);

  return (
    <BaseWidget title="Weather" {...props}>
      <div
        className="weather__container"
        ref={containerRef}
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
        <div
          className="weather__forecastContainer"
          style={{ opacity: showForecast ? 1 : 0 }}
        >
          {/* Navigation Buttons */}
          {showForecast && hourlyPages.length > 1 && (
            <>
              <button
                className={`weather__navButton weather__navButton--prev ${
                  !canGoPrev ? "weather__navButton--disabled" : ""
                }`}
                onClick={prevPage}
                disabled={!canGoPrev}
              >
                ‹
              </button>
              <button
                className={`weather__navButton weather__navButton--next ${
                  !canGoNext ? "weather__navButton--disabled" : ""
                }`}
                onClick={nextPage}
                disabled={!canGoNext}
              >
                ›
              </button>
            </>
          )}

          {/* Carousel Content */}
          <div className="weather__forecastList" ref={forecastListRef}>
            <div className="weather__forecastTrack">
              {hourlyPages.map((page, pageIdx) => (
                <div
                  key={pageIdx}
                  className="weather__forecastPage"
                  style={{
                    transform: `translateX(${
                      (pageIdx - currentPageIndex) * 100
                    }%)`,
                    display: "flex",
                  }}
                >
                  {page.map((hour, hourIdx) => (
                    <div
                      className="weather__forecastItem"
                      key={`${pageIdx}-${hourIdx}`}
                      style={{
                        width: `${100 / page.length}%`,
                        flexShrink: 0,
                      }}
                    >
                      <div className="weather__forecastTime">
                        {new Date(hour.time).getHours()}:00
                      </div>
                      <div className="weather__forecastIcon">
                        <Image
                          className="weather__forecastIcon__img"
                          // Use the WeatherAPI condition code and is_day flag to pick the right PNG
                          src={getWeatherIcon(
                            hour.condition?.code,
                            hour.is_day
                          )}
                          alt={hour.condition.text}
                          width={32}
                          height={32}
                          unoptimized
                        />
                      </div>
                      <div className="weather__forecastTemp">
                        {Math.round(hour.temp_c)}°C
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
