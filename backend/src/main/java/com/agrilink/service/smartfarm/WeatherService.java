package com.agrilink.service.smartfarm;

import com.agrilink.dto.response.SmartFarmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Weather service using Open-Meteo API (free, no API key required).
 * Open-Meteo provides current weather + 7-day forecast with agricultural parameters.
 * Official: https://open-meteo.com/
 */
@Service
@Slf4j
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

    public SmartFarmResponse getCurrentWeather(double lat, double lon) {
        try {
            String url = OPEN_METEO_URL +
                    "?latitude=" + lat +
                    "&longitude=" + lon +
                    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure" +
                    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,weather_code" +
                    "&timezone=Asia/Kolkata" +
                    "&forecast_days=7";

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null) {
                return SmartFarmResponse.unavailable("OPEN_METEO", "Empty response from weather API");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> current = (Map<String, Object>) response.get("current");
            @SuppressWarnings("unchecked")
            Map<String, Object> daily = (Map<String, Object>) response.get("daily");

            Map<String, Object> weatherData = new LinkedHashMap<>();

            // Current weather
            if (current != null) {
                weatherData.put("temperature", current.get("temperature_2m"));
                weatherData.put("humidity", current.get("relative_humidity_2m"));
                weatherData.put("apparentTemperature", current.get("apparent_temperature"));
                weatherData.put("precipitation", current.get("precipitation"));
                weatherData.put("rain", current.get("rain"));
                weatherData.put("windSpeed", current.get("wind_speed_10m"));
                weatherData.put("windDirection", current.get("wind_direction_10m"));
                weatherData.put("pressure", current.get("surface_pressure"));
                weatherData.put("weatherCode", current.get("weather_code"));
                weatherData.put("weatherCondition", decodeWeatherCode(current.get("weather_code")));
            }

            // 7-day forecast
            if (daily != null) {
                List<Map<String, Object>> forecast = new ArrayList<>();
                @SuppressWarnings("unchecked")
                List<String> dates = (List<String>) daily.get("time");
                @SuppressWarnings("unchecked")
                List<Number> maxTemps = (List<Number>) daily.get("temperature_2m_max");
                @SuppressWarnings("unchecked")
                List<Number> minTemps = (List<Number>) daily.get("temperature_2m_min");
                @SuppressWarnings("unchecked")
                List<Number> precipSum = (List<Number>) daily.get("precipitation_sum");
                @SuppressWarnings("unchecked")
                List<Number> rainSum = (List<Number>) daily.get("rain_sum");
                @SuppressWarnings("unchecked")
                List<Number> precipProb = (List<Number>) daily.get("precipitation_probability_max");
                @SuppressWarnings("unchecked")
                List<Number> codes = (List<Number>) daily.get("weather_code");

                if (dates != null) {
                    for (int i = 0; i < dates.size(); i++) {
                        Map<String, Object> day = new LinkedHashMap<>();
                        day.put("date", dates.get(i));
                        day.put("maxTemp", maxTemps != null && i < maxTemps.size() ? maxTemps.get(i) : null);
                        day.put("minTemp", minTemps != null && i < minTemps.size() ? minTemps.get(i) : null);
                        day.put("precipitation", precipSum != null && i < precipSum.size() ? precipSum.get(i) : null);
                        day.put("rain", rainSum != null && i < rainSum.size() ? rainSum.get(i) : null);
                        day.put("rainProbability", precipProb != null && i < precipProb.size() ? precipProb.get(i) : null);
                        day.put("weatherCode", codes != null && i < codes.size() ? codes.get(i) : null);
                        day.put("weatherCondition", codes != null && i < codes.size() ? decodeWeatherCode(codes.get(i)) : null);
                        forecast.add(day);
                    }
                }
                weatherData.put("forecast", forecast);
            }

            weatherData.put("latitude", lat);
            weatherData.put("longitude", lon);

            return SmartFarmResponse.verified("OPEN_METEO", weatherData);
        } catch (Exception e) {
            log.error("Weather API error: {}", e.getMessage());
            return SmartFarmResponse.apiError("OPEN_METEO", e.getMessage());
        }
    }

    private String decodeWeatherCode(Object code) {
        if (code == null) return "Unknown";
        int c = code instanceof Number ? ((Number) code).intValue() : 0;
        return switch (c) {
            case 0 -> "Clear sky";
            case 1 -> "Mainly clear";
            case 2 -> "Partly cloudy";
            case 3 -> "Overcast";
            case 45, 48 -> "Foggy";
            case 51, 53, 55 -> "Drizzle";
            case 61, 63, 65 -> "Rain";
            case 66, 67 -> "Freezing rain";
            case 71, 73, 75 -> "Snowfall";
            case 80, 81, 82 -> "Rain showers";
            case 85, 86 -> "Snow showers";
            case 95 -> "Thunderstorm";
            case 96, 99 -> "Thunderstorm with hail";
            default -> "Unknown (" + c + ")";
        };
    }
}
