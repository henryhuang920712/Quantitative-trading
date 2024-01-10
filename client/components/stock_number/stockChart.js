"use client";

import { useEffect, useState, useRef } from "react";
import {createChart} from 'lightweight-charts';
import Container from 'react-bootstrap/Container';
import { getStockPrices } from '@/lib/getStockInfo';

export default function StockChart({stock_number}) {
    const [pricesData, setPricesData] = useState(null);
    const parentElement = useRef(null);
    const hasMounted = useRef(false);

    useEffect(() => {
        async function getStockPricesData() {
            const nowPricesData = await getStockPrices(stock_number);
            setPricesData(nowPricesData);
        }
        if (!hasMounted.current) {
            getStockPricesData();
            hasMounted.current = true;
        }
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && pricesData && hasMounted.current) {
            const chart = createChart(parentElement.current, { autoSize: true});
            // size change listener


            let data = pricesData.map(price => {
                // change date to string + 1911
                return { time: price.dateString, open: price.open, high: price.high, low: price.low, close: price.close };
            });

            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#EF5350',
                downColor: '#26A69A',
                borderVisible: false,
                wickUpColor: '#EF5350', 
                wickDownColor: '#26A69A'
              })
              
              try {
                candlestickSeries.setData(data);
              } catch (error) {
                console.log(data);
                console.log(error);
              }
    
        }
    }, [pricesData]);
    return (
        <Container fluid ref={parentElement} id="chart-container" className="w-100 h-100">
        </Container>
    )
}