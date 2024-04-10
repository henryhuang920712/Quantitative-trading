"use client";

import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import getStockIndex from '@/lib/getStockIndex';
import {createChart} from 'lightweight-charts';

export function MainIndexChart() {
    const [indexData, setIndexData] = useState(null);
    const parentElement = useRef(null);
    const hasMounted = useRef(false);
    useEffect(() => {
        async function getStockIndexData() {
            const nowStockIndexData = await getStockIndex('^TWII');
            setIndexData(nowStockIndexData);
        }
        if (!hasMounted.current) {
            getStockIndexData();
            hasMounted.current = true;
        }
    }, [])
    useEffect(() => {
        if (parentElement.current && indexData && hasMounted.current) {
            const chart = createChart(parentElement.current, { autoSize: true});
            // size change listener

            let data = indexData.map(price => {
                // change date to string + 1911
                return { time: price.Date, open: price.Open, high: price.High, low: price.Low, close: price.Close };
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
    }, [indexData]);
    return (
        <Container fluid ref={parentElement} id="chart-container" className="w-100 h-100">
        </Container>
    )
}
