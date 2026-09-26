import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';

const DEFAULT_DISTRICTS = [
  'Erode', 'Salem', 'Coimbatore', 'Chennai', 'Dindigul',
  'Tirupur', 'Madurai', 'Tiruchirappalli', 'Dharmapuri', 'Krishnagiri',
  'Namakkal', 'Karur', 'Thanjavur', 'Tirunelveli', 'Vellore',
  'Cuddalore', 'Kanchipuram', 'Villupuram', 'Theni', 'Nilgiris'
];

export default function GovernmentMarketPricesCard({ initialDistrict = 'Erode' }) {
  const [district, setDistrict] = useState(initialDistrict);
  const [districtsList, setDistrictsList] = useState(DEFAULT_DISTRICTS);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Chart state
  const [selectedCommodity, setSelectedCommodity] = useState('Tomato');
  const [availableCommodities, setAvailableCommodities] = useState([]);
  const [chartDays, setChartDays] = useState(30); // 7, 30, 90
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch available districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/market-prices/districts');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setDistrictsList(res.data.data);
        }
      } catch (err) {
        // Fallback to DEFAULT_DISTRICTS
      }
    };
    fetchDistricts();
  }, []);

  // Fetch market prices whenever district changes
  useEffect(() => {
    fetchMarketPrices(district);
  }, [district]);

  // Fetch history whenever district, commodity, or date range changes
  useEffect(() => {
    if (viewMode === 'chart' && selectedCommodity) {
      fetchPriceHistory(district, selectedCommodity, chartDays);
    }
  }, [district, selectedCommodity, chartDays, viewMode]);

  const fetchMarketPrices = async (targetDistrict) => {
    setLoading(true);
    try {
      const res = await api.get(`/market-prices?district=${encodeURIComponent(targetDistrict)}`);
      const payload = res.data?.data;
      setMarketData(payload);

      // Extract commodities from records if available
      if (payload?.records && payload.records.length > 0) {
        const comms = [...new Set(payload.records.map((r) => r.commodity))].filter(Boolean);
        setAvailableCommodities(comms);
        if (!comms.includes(selectedCommodity)) {
          setSelectedCommodity(comms[0]);
        }
      } else {
        // Fetch commodities list from backend
        try {
          const cRes = await api.get(`/market-prices/commodities?district=${encodeURIComponent(targetDistrict)}`);
          if (cRes.data?.data && cRes.data.data.length > 0) {
            setAvailableCommodities(cRes.data.data);
          }
        } catch (_) {}
      }
    } catch (err) {
      setMarketData({
        status: 'SOURCE_ERROR',
        message: err.response?.data?.message || 'Failed to connect to backend market-prices API',
        records: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (targetDistrict, commodity, days) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(
        `/market-prices/history?district=${encodeURIComponent(targetDistrict)}&commodity=${encodeURIComponent(commodity)}&days=${days}`
      );
      const points = res.data?.data?.points || [];
      setHistoryData(points);
    } catch (err) {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const records = marketData?.records || [];
  const status = marketData?.status || 'DATA_UNAVAILABLE';
  const sourceName = marketData?.source || 'AGMARKNET / data.gov.in';
  const dataDate = marketData?.date;
  const fetchedAt = marketData?.fetchedAt;

  // Filter records by search term
  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.commodity?.toLowerCase().includes(term) ||
      r.market?.toLowerCase().includes(term)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow col-span-full"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-sm">
            💹
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              Government Market Prices
              {status === 'VERIFIED' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  ✓ VERIFIED
                </span>
              )}
              {status === 'DATA_UNAVAILABLE' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  ⚠️ DATA_UNAVAILABLE
                </span>
              )}
              {status === 'SOURCE_ERROR' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  ❌ SOURCE_ERROR
                </span>
              )}
              {status === 'NO_CURRENT_DATA' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  ⏳ NO_CURRENT_DATA
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              Direct wholesale market arrivals & prices verified from MongoDB
            </p>
          </div>
        </div>

        {/* Controls: District & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-gray-500 font-medium">District:</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
            >
              {districtsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-agri-green shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Table View
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-agri-green shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Chart View
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchMarketPrices(district)}
            disabled={loading}
            title="Refresh prices from MongoDB"
            className="p-1.5 text-gray-500 hover:text-agri-green hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-agri-green' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Metadata Transparency Strip */}
      <div className="py-2.5 px-3 my-3 bg-gray-50/80 rounded-xl flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2 border border-gray-100">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="text-gray-700">Source:</strong> {sourceName}
          </span>
          {dataDate && (
            <span>
              <strong className="text-gray-700">Data Date:</strong> {dataDate}
            </span>
          )}
          {marketData?.market && (
            <span>
              <strong className="text-gray-700">Market:</strong> {marketData.market}
            </span>
          )}
        </div>
        {fetchedAt && (
          <span className="text-gray-400">
            Last Synchronized: {new Date(fetchedAt).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-agri-green border-t-transparent rounded-full" />
          <p className="text-xs text-gray-500 mt-2">Loading verified market records from MongoDB...</p>
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && viewMode === 'table' && (
        <div>
          {/* Search Bar for vegetables */}
          {records.length > 0 && (
            <div className="mb-3 flex justify-between items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vegetable (e.g. Tomato, Onion)..."
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg w-full max-w-xs focus:outline-none focus:border-agri-green focus:ring-1 focus:ring-agri-green"
              />
              <span className="text-xs text-gray-400">
                Showing {filteredRecords.length} of {records.length} commodities
              </span>
            </div>
          )}

          {records.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">Vegetable</th>
                    <th scope="col" className="px-4 py-3 text-left">Price</th>
                    <th scope="col" className="px-4 py-3 text-left">Retail Range</th>
                    <th scope="col" className="px-4 py-3 text-left">Unit</th>
                    <th scope="col" className="px-4 py-3 text-left">Date</th>
                    <th scope="col" className="px-4 py-3 text-left">Market</th>
                    <th scope="col" className="px-4 py-3 text-left">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-green-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {r.commodity}
                      </td>
                      <td className="px-4 py-3 font-bold text-agri-green whitespace-nowrap text-sm">
                        ₹{r.price}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {r.retailPriceMin != null && r.retailPriceMax != null ? (
                          `₹${r.retailPriceMin} - ₹${r.retailPriceMax}`
                        ) : r.retailPriceMin != null ? (
                          `₹${r.retailPriceMin}`
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {r.unit || '1 kg'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {r.market || district}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-[11px]">
                        {r.source || sourceName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 px-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl">⚠️</span>
              <h4 className="text-sm font-bold text-gray-800 mt-2">DATA_UNAVAILABLE</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                {marketData?.message ||
                  `No verified market prices currently saved in MongoDB for ${district}. Daily synchronization connects to the official government source automatically.`}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => fetchMarketPrices('Erode')}
                  className="text-xs text-agri-green border border-agri-green hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  View Erode Market
                </button>
                <button
                  onClick={() => fetchMarketPrices('Salem')}
                  className="text-xs text-agri-green border border-agri-green hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  View Salem Market
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE CHART VIEW */}
      {!loading && viewMode === 'chart' && (
        <div className="space-y-4">
          {/* Chart Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {/* Commodity Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-700">Select Vegetable:</label>
              <select
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-agri-green cursor-pointer"
              >
                {availableCommodities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selection (7 Days, 30 Days, 3 Months) */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">Range:</span>
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '3 Months', days: 90 },
              ].map((btn) => (
                <button
                  key={btn.days}
                  onClick={() => setChartDays(btn.days)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    chartDays === btn.days
                      ? 'bg-agri-green text-white font-semibold shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          {historyLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-agri-green border-t-transparent rounded-full" />
              <p className="text-xs text-gray-500 mt-2">Loading historical price trends from MongoDB...</p>
            </div>
          ) : historyData.length > 0 ? (
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      const parts = val.split('-');
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={{ fill: '#16a34a', r: 4 }}
                    activeDot={{ r: 6, fill: '#15803d', stroke: '#fff', strokeWidth: 2 }}
                    name="Wholesale Price"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-[11px] text-gray-400 mt-1">
                Date (X-Axis) vs Price in ₹ (Y-Axis) • Hover over data points to inspect market details
              </p>
            </div>
          ) : (
            <div className="py-12 px-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl">📉</span>
              <h4 className="text-sm font-bold text-gray-800 mt-2">DATA_UNAVAILABLE</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                No historical records available for {selectedCommodity} in {district} over the past {chartDays} days.
                Prices will accumulate as daily synchronizations execute.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Custom interactive Tooltip for chart
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 text-white p-3 rounded-xl shadow-xl text-xs backdrop-blur-sm border border-gray-700">
        <p className="font-bold text-green-400 text-sm">{data.commodity}</p>
        <p className="text-gray-300 mt-1">
          <span className="text-gray-400">Date:</span> {data.date}
        </p>
        <p className="text-white font-semibold text-sm mt-0.5">
          <span className="text-gray-400 font-normal">Price:</span> ₹{data.price} / {data.unit || '1 kg'}
        </p>
        {data.retailPriceMin != null && data.retailPriceMax != null && (
          <p className="text-gray-300">
            <span className="text-gray-400">Retail:</span> ₹{data.retailPriceMin} - ₹{data.retailPriceMax}
          </p>
        )}
        <p className="text-gray-400 mt-1 text-[10px]">
          📍 Market: {data.market}
        </p>
      </div>
    );
  }
  return null;
}
