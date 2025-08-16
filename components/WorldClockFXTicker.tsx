import React, { useState, useEffect } from 'react';
import { GlobeIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import { useCurrency } from './CurrencyContext';
import { mockFxRates } from './fxService';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/25 ${className}`}>
      {children}
    </div>
);

interface MarketTime {
    city: string;
    timeZone: string;
    marketOpen: number; // Hour in 24h format, local time
    marketClose: number; // Hour in 24h format, local time
}

const financialHubs: MarketTime[] = [
    { city: 'New York', timeZone: 'America/New_York', marketOpen: 9, marketClose: 16 },
    { city: 'London', timeZone: 'Europe/London', marketOpen: 8, marketClose: 16 },
    { city: 'Tokyo', timeZone: 'Asia/Tokyo', marketOpen: 9, marketClose: 15 },
    { city: 'Hong Kong', timeZone: 'Asia/Hong_Kong', marketOpen: 9, marketClose: 16 },
];

const Clock: React.FC<{ hub: MarketTime }> = ({ hub }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: hub.timeZone,
    });
    
    const localTimeParts = formatter.formatToParts(time);
    const localHourPart = localTimeParts.find(p => p.type === 'hour');
    const periodPart = localTimeParts.find(p => p.type === 'dayPeriod');
    
    let hour24 = 0;
    if (localHourPart && periodPart) {
        const localHour = parseInt(localHourPart.value, 10);
        const period = periodPart.value;
        hour24 = period === 'PM' && localHour !== 12 ? localHour + 12 : (period === 'AM' && localHour === 12 ? 0 : localHour);
    }
    
    const dayOfWeek = new Date().toLocaleString('en-us', { timeZone: hub.timeZone, weekday: 'short' });
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
    const isMarketOpen = !isWeekend && hour24 >= hub.marketOpen && hour24 < hub.marketClose;

    return (
        <div className="text-center">
            <p className="text-sm font-semibold text-white">{hub.city}</p>
            <p className="font-mono text-lg text-slate-300 tracking-wider">{formatter.format(time)}</p>
            <div className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${isMarketOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isMarketOpen ? 'Open' : 'Closed'}
            </div>
        </div>
    );
};

const WorldClockFXTicker: React.FC = () => {
    const { currency } = useCurrency();
    
    const fxPairs = Object.keys(mockFxRates)
        .filter(c => c !== currency && c !== 'USD')
        .slice(0, 8)
        .map(c => {
            const baseRate = mockFxRates[currency] || 1;
            const targetRate = mockFxRates[c] || 1;
            const rate = targetRate / baseRate;
            const change = (Math.random() - 0.5) * 0.02; // Mock 24h change up to +/- 1%
            return {
                pair: `${c}/${currency}`,
                rate: rate.toFixed(4),
                change: (change * 100).toFixed(2),
                isPositive: change >= 0,
            };
        });

    return (
        <Card className="overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-slate-800">
                <GlobeIcon className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-semibold text-white">Global Markets</h3>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {financialHubs.map(hub => <Clock key={hub.city} hub={hub} />)}
            </div>
            <div className="relative w-full h-10 bg-slate-900/70 border-t border-slate-800 flex items-center overflow-hidden">
                <div className="animate-marquee whitespace-nowrap flex items-center">
                    {fxPairs.map(item => (
                        <div key={item.pair} className="flex items-center mx-4 text-sm">
                            <span className="font-semibold text-slate-300">{item.pair}</span>
                            <span className="ml-2 font-mono text-white">{item.rate}</span>
                            <span className={`ml-2 font-semibold flex items-center ${item.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.isPositive ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>}
                                {item.change}%
                            </span>
                        </div>
                    ))}
                     {/* Duplicate for seamless scroll */}
                    {fxPairs.map(item => (
                        <div key={`${item.pair}-2`} className="flex items-center mx-4 text-sm">
                            <span className="font-semibold text-slate-300">{item.pair}</span>
                            <span className="ml-2 font-mono text-white">{item.rate}</span>
                            <span className={`ml-2 font-semibold flex items-center ${item.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.isPositive ? <ArrowUpIcon className="w-3 h-3"/> : <ArrowDownIcon className="w-3 h-3"/>}
                                {item.change}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default WorldClockFXTicker;