import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function StatusBadge({ status, source }) {
  const colors = {
    VERIFIED: 'bg-green-100 text-green-700',
    MODELLED: 'bg-blue-100 text-blue-700',
    ESTIMATED: 'bg-yellow-100 text-yellow-700',
    DATA_UNAVAILABLE: 'bg-gray-100 text-gray-500',
    MODEL_NOT_AVAILABLE: 'bg-orange-100 text-orange-600',
    API_ERROR: 'bg-red-100 text-red-600',
    AI_NOT_CONFIGURED: 'bg-gray-100 text-gray-500',
    CONFIGURATION_REQUIRED: 'bg-yellow-100 text-yellow-700',
    GENERATED: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="flex items-center gap-2 mt-2 text-[10px]">
      <span className={`px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
      {source && <span className="text-gray-400">Source: {source}</span>}
    </div>
  );
}

function DataCard({ title, icon, children, status, source, retrievedAt }) {
  return (
    <motion.div variants={fadeUp} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="min-h-[60px]">{children}</div>
      <StatusBadge status={status} source={source} />
      {retrievedAt && (
        <p className="text-[10px] text-gray-400 mt-1">
          Updated: {new Date(retrievedAt).toLocaleString('en-IN')}
        </p>
      )}
    </motion.div>
  );
}

function FarmMap({ lat, lon, weather }) {
  const weatherEmoji = weather?.weatherCondition?.includes('Rain') ? '🌧️' :
    weather?.weatherCondition?.includes('Cloud') ? '☁️' :
    weather?.weatherCondition?.includes('Thunder') ? '⛈️' :
    weather?.weatherCondition?.includes('Fog') ? '🌫️' : '☀️';

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <iframe
        title="Farm Location"
        width="100%"
        height="280"
        style={{ border: 0 }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05}%2C${lat-0.05}%2C${lon+0.05}%2C${lat+0.05}&layer=mapnik&marker=${lat}%2C${lon}`}
        loading="lazy"
      />
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weatherEmoji}</span>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {weather?.temperature != null ? `${weather.temperature}°C` : '--'}
              {weather?.humidity != null && <span className="text-gray-500 font-normal"> • {weather.humidity}% humidity</span>}
            </p>
            <p className="text-xs text-gray-500">{weather?.weatherCondition || 'Loading...'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">📍 {lat.toFixed(4)}, {lon.toFixed(4)}</p>
          {weather?.windSpeed != null && (
            <p className="text-[10px] text-gray-400">💨 Wind: {weather.windSpeed} km/h</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SmartFarmIntelligence({ farmLocation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const lat = farmLocation?.latitude || 0;
  const lon = farmLocation?.longitude || 0;

  useEffect(() => {
    if (lat !== 0 && lon !== 0) {
      loadSmartData();
    }
  }, [lat, lon]);

  const loadSmartData = async () => {
    setLoading(true);
    setError(null);
    try {
      const lang = user?.preferredLanguage || 'en';
      const res = await api.get(`/farmer/smart/summary?lat=${lat}&lon=${lon}&lang=${lang}`);
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load smart farming data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (lat === 0 && lon === 0) {
    return (
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
        <span className="text-4xl">📍</span>
        <p className="text-yellow-700 mt-2 font-medium">Set your farm location in your profile to get Smart Farm Intelligence</p>
        <p className="text-yellow-600 text-sm mt-1">Go to Profile → Update your farm GPS location</p>
      </div>
    );
  }

  const weather = data?.weather;
  const climate = data?.climate;
  const soil = data?.soil;
  const groundwater = data?.groundwater;
  const market = data?.market;
  const ml = data?.mlPredictions;
  const ai = data?.aiExplanation;

  const wd = weather?.status === 'VERIFIED' ? weather.data : null;
  const cd = climate?.status === 'VERIFIED' ? climate.data : null;
  const sd = soil?.status === 'VERIFIED' ? soil.data : null;
  const md = market?.status === 'VERIFIED' ? market.data : null;

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🧠 Smart Farm Intelligence
          </h2>
          <p className="text-sm text-gray-500 mt-1">Real-time data from verified external sources • AI-powered insights</p>
        </div>
        <button onClick={loadSmartData} disabled={loading}
          className="text-sm bg-agri-green text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-1">
          {loading ? <span className="animate-spin">⏳</span> : '🔄'} Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Fetching real-time farm data...</p>
          <p className="text-gray-400 text-sm mt-1">Weather • Climate • Soil • Market • AI Analysis</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 flex items-center gap-2">
          ⚠️ {error}
          <button onClick={loadSmartData} className="ml-auto text-red-600 underline text-xs">Retry</button>
        </div>
      )}

      {data && (
        <>
          {/* Farm Location Map with Weather Overlay */}
          <div className="mb-6">
            <FarmMap lat={lat} lon={lon} weather={wd} />
          </div>

          {/* Row 1: Weather + Climate + Soil */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <DataCard title="Current Weather" icon="🌤️" status={weather?.status} source={weather?.source} retrievedAt={weather?.retrievedAt}>
              {wd ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Temperature</span><span className="font-semibold">{wd.temperature}°C</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Feels Like</span><span className="font-semibold">{wd.apparentTemperature}°C</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Humidity</span><span className="font-semibold">{wd.humidity}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Rain</span><span className="font-semibold">{wd.rain} mm</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Wind</span><span className="font-semibold">{wd.windSpeed} km/h</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Pressure</span><span className="font-semibold">{wd.pressure} hPa</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Condition</span><span className="font-semibold">{wd.weatherCondition}</span></div>
                </div>
              ) : <p className="text-gray-400 text-sm">Data currently unavailable</p>}
            </DataCard>

            <DataCard title="30-Day Climate History" icon="📊" status={climate?.status} source={climate?.source} retrievedAt={climate?.retrievedAt}>
              {cd ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Temp</span><span className="font-semibold">{cd.avgTemperature}°C</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Max Temp</span><span className="font-semibold">{cd.avgMaxTemp}°C</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Min Temp</span><span className="font-semibold">{cd.avgMinTemp}°C</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total Rain</span><span className="font-semibold">{cd.totalRainfall} mm</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Humidity</span><span className="font-semibold">{cd.avgHumidity}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Solar Rad.</span><span className="font-semibold">{cd.avgSolarRadiation} MJ/m²</span></div>
                  <p className="text-[10px] text-gray-400 mt-1">{cd.period}</p>
                </div>
              ) : <p className="text-gray-400 text-sm">Data currently unavailable</p>}
            </DataCard>

            <DataCard title="Soil Analysis" icon="🌱" status={soil?.status} source={soil?.source} retrievedAt={soil?.retrievedAt}>
              {sd ? (
                <div className="space-y-1.5">
                  {sd.pH && <div className="flex justify-between text-sm"><span className="text-gray-500">pH Level</span><span className="font-semibold">{sd.pH.value}</span></div>}
                  {sd.organicCarbon && <div className="flex justify-between text-sm"><span className="text-gray-500">Organic Carbon</span><span className="font-semibold">{sd.organicCarbon.value} {sd.organicCarbon.unit}</span></div>}
                  {sd.clay && <div className="flex justify-between text-sm"><span className="text-gray-500">Clay</span><span className="font-semibold">{sd.clay.value} {sd.clay.unit}</span></div>}
                  {sd.sand && <div className="flex justify-between text-sm"><span className="text-gray-500">Sand</span><span className="font-semibold">{sd.sand.value} {sd.sand.unit}</span></div>}
                  {sd.silt && <div className="flex justify-between text-sm"><span className="text-gray-500">Silt</span><span className="font-semibold">{sd.silt.value} {sd.silt.unit}</span></div>}
                  {sd.nitrogen && <div className="flex justify-between text-sm"><span className="text-gray-500">Nitrogen</span><span className="font-semibold">{sd.nitrogen.value} {sd.nitrogen.unit}</span></div>}
                </div>
              ) : <p className="text-gray-400 text-sm">Data currently unavailable</p>}
            </DataCard>
          </div>

          {/* Row 2: Market + Groundwater */}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <DataCard title="Government Market Prices" icon="💹" status={market?.status} source={market?.source} retrievedAt={market?.retrievedAt}>
              {md && md.markets && md.markets.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {md.markets.slice(0, 5).map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-gray-900">{m.commodity} — {m.market}</p>
                      <div className="flex gap-3 text-xs mt-1">
                        <span className="text-green-600">Min ₹{m.minPrice}</span>
                        <span className="text-blue-600 font-bold">Modal ₹{m.modalPrice}</span>
                        <span className="text-red-600">Max ₹{m.maxPrice}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.date} • {m.district}, {m.state}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  {market?.status === 'CONFIGURATION_REQUIRED' ? 'Market API key not configured (MARKET_API_KEY)' : 'No market data available'}
                </p>
              )}
            </DataCard>

            <DataCard title="Groundwater Status" icon="💧" status={groundwater?.status} source={groundwater?.source} retrievedAt={groundwater?.retrievedAt}>
              <p className="text-gray-400 text-sm">
                {groundwater?.data?.message || 'District-level groundwater data requires manual integration from CGWB/India-WRIS.'}
              </p>
              <p className="text-[10px] text-gray-400 mt-2">Note: No stable public REST API available from CGWB</p>
            </DataCard>
          </div>

          {/* ML Predictions Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {[
              { key: 'cropSuitability', title: 'Crop Suitability', icon: '🌾' },
              { key: 'yield', title: 'Yield Estimate', icon: '📈' },
              { key: 'price', title: 'Price Forecast', icon: '💰' },
              { key: 'demand', title: 'Demand Analysis', icon: '📦' },
              { key: 'rainRisk', title: 'Rain Risk', icon: '🌧️' },
            ].map(({ key, title, icon }) => {
              const pred = ml?.[key];
              return (
                <motion.div key={key} variants={fadeUp}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                  <span className="text-2xl">{icon}</span>
                  <h4 className="text-xs font-semibold text-gray-700 mt-1">{title}</h4>
                  {pred?.status === 'MODEL_NOT_AVAILABLE' ? (
                    <p className="text-[10px] text-orange-500 mt-2">ML model training in progress</p>
                  ) : pred?.data?.prediction ? (
                    <p className="text-lg font-bold text-agri-green mt-1">{JSON.stringify(pred.data.prediction)}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-2">Pending</p>
                  )}
                  <StatusBadge status={pred?.status} source={pred?.source} />
                </motion.div>
              );
            })}
          </div>

          {/* AI Smart Explanation */}
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold text-gray-900">AGRILINK AI Smart Analysis</h3>
                <p className="text-[10px] text-gray-500">Powered by Google Gemini — Based on real-time API data only</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={ai?.status} source={ai?.source} />
              </div>
            </div>
            {ai?.status === 'GENERATED' && ai?.data?.explanation ? (
              <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed text-sm">
                  {ai.data.explanation}
                </div>
              </div>
            ) : ai?.status === 'AI_NOT_CONFIGURED' ? (
              <div className="bg-white/50 rounded-xl p-4">
                <p className="text-gray-500 text-sm">🔑 AI explanation requires Gemini API key (AI_API_KEY in Render env).</p>
              </div>
            ) : (
              <div className="bg-white/50 rounded-xl p-4">
                <p className="text-gray-500 text-sm">AI analysis currently unavailable. Check API configuration.</p>
              </div>
            )}
            {ai?.data?.basedOn && ai.data.basedOn.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-3">📊 Data sources: {ai.data.basedOn.join(' • ')}</p>
            )}
          </div>

          {/* 7-Day Forecast Expandable */}
          {wd?.forecast && wd.forecast.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setExpanded(!expanded)} 
                className="text-sm text-agri-green font-medium hover:underline flex items-center gap-1">
                {expanded ? '▲ Hide' : '▼ Show'} 7-Day Weather Forecast
              </button>
              {expanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-7 gap-2 mt-3">
                  {wd.forecast.map((day, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                      <p className="text-[10px] text-gray-500 font-medium">
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-2xl mt-1">
                        {day.weatherCondition?.includes('Rain') ? '🌧️' : 
                         day.weatherCondition?.includes('Cloud') ? '☁️' : 
                         day.weatherCondition?.includes('Thunder') ? '⛈️' : '☀️'}
                      </p>
                      <p className="text-xs font-semibold mt-1">{day.maxTemp}°/{day.minTemp}°</p>
                      {day.rainProbability != null && (
                        <p className="text-[10px] text-blue-500">{day.rainProbability}% 💧</p>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
