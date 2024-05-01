"use client";
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import {GetStockInfo, GetStockInfoFugle} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import {GetWeeklyPrices, GetMonthlyPrices} from '@/lib/formatData';
import Nav from 'react-bootstrap/Nav';

// function timeToTz(date, timeZone) {
//     const zonedDate = new Date((typeof date === "string" ? new Date(date) : date).toLocaleString('en-US', {timeZone: timeZone}));
//     return zonedDate.getTime() / 1000;
// }   


function timeToLocal(date) {
    // Create a Date object from the timestamp
    const d = new Date(date);

    // Return the UTC timestamp
    return Date.UTC(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds()
    ) / 1000;
}

export default function StockChart({stock_number}) {
    const [activeKey, setActiveKey] = useState('D');
    const [pricesData, setPricesData] = useState(null);
    const parentElement = useRef(null);
    const timeInterval = {
        "1": "1分",
        "5": "5分",
        "15": "15分",
        "60": "60分",
        "D": "日",
        "W": "周",
        "M": "月",
    }
    const handleSelect = (selectedKey) => {
        setActiveKey(selectedKey);
    }

 

    useEffect(() => {
        async function getStockPricesData() {
            const isMinute = activeKey === "1" || activeKey === "5" || activeKey === "15" || activeKey === "60";
            if (isMinute) {
                const nowPricesData = await GetStockInfoFugle(stock_number, activeKey);
                nowPricesData.sort((a, b) => new Date(a.date) - new Date(b.date));
                setPricesData(nowPricesData);
            } else {
                const nowPricesData = await GetStockInfo(stock_number, "prices");
                nowPricesData.sort((a, b) => new Date(a.date) - new Date(b.date));
                if (activeKey === "W") {
                    const weeklyPrices = GetWeeklyPrices(nowPricesData);
                    setPricesData(weeklyPrices);
                } else if (activeKey === "M") {
                    const monthlyPrices = GetMonthlyPrices(nowPricesData);
                    setPricesData(monthlyPrices);
                } else {
                    setPricesData(nowPricesData);
                }
            }
        }
        getStockPricesData();
    }, [stock_number, activeKey]);

    useEffect(() => {
        if (parentElement.current && pricesData) {
            // if it exists, clear the chart
            if (document.getElementById("stock-chart-container")) {
                document.getElementById("stock-chart-container").innerHTML = "";
            }

            const chart = createChart(parentElement.current, { autoSize: true});
            if (activeKey === "1" || activeKey === "5" || activeKey === "15" || activeKey === "60") {
                chart.timeScale().applyOptions({
                    timeVisible: true,
                    secondsVisible: false,
                });
            }

            // size change listener
            let data = pricesData.map(price => {
                // change date to string + 1911
                return { time: Math.floor( timeToLocal(price.date)), open: price.open, high: price.high, low: price.low, close: price.close };
            });
            console.log(pricesData[pricesData.length - 1].date);
            console.log(new Date(data[data.length - 1].time * 1000));

            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#EF5350',
                downColor: '#26A69A',
                borderVisible: false,
                wickUpColor: '#EF5350', 
                wickDownColor: '#26A69A'
              })
              

            let volumeData = pricesData.map(price => { 
                return { time: Math.floor(timeToLocal(price.date)), 
                value: price.volume,
                color: price.open > price.close ? '#26a69a' : '#ef5350'};
            });
            const volumeSeries = chart.addHistogramSeries({ 
                color: '#26a69a', 
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '',
            });

            let maData = calculateMovingAverageSeriesData(data, 5);
            const maSeries = chart.addLineSeries({ color: '#ffd700', lineWidth: 1 });
            volumeSeries.priceScale().applyOptions({
                // set the positioning of the volume series
                scaleMargins: {
                    top: 0.7, // highest point of the series will be 70% away from the top
                    bottom: 0,
                },
            });
            try {
                candlestickSeries.setData(data);
                volumeSeries.setData(volumeData);
                maSeries.setData(maData);
                // fit the chart
              } catch (error) {
                console.log(data);
                console.log(error);
              }
        }
    }, [pricesData]);
    return (
    <Container fluid className="w-100 h-100">
        <Container fluid className="stocknum-info-nav w-100 py-2">
            <Nav variant="pills" defaultActiveKey="D" onSelect={handleSelect}>
            {
                Object.keys(timeInterval).map((key) => {
                    return (
                        <Nav.Item key={key}>
                            <Nav.Link eventKey={key} active={activeKey === key} className="me-2" >{timeInterval[key]}</Nav.Link>
                        </Nav.Item>
                    )
                })
            }
            </Nav>
        </Container>
        <Container fluid ref={parentElement} id="stock-chart-container" className="mw-100 w-100 h-75 stock-charts">
        </Container>
    </Container>
    )
}

   
function calculateMovingAverageSeriesData(candleData, maLength) {
    const maData = [];

    for (let i = 0; i < candleData.length; i++) {
        if (i < maLength) {
            // Provide whitespace data points until the MA can be calculated
            maData.push({ time: candleData[i].time });
        } else {
            // Calculate the moving average, slow but simple way
            let sum = 0;
            for (let j = 0; j < maLength; j++) {
                sum += candleData[i - j].close;
            }
            const maValue = sum / maLength;
            maData.push({ time: candleData[i].time, value: maValue });
        }
    }

return maData;
}