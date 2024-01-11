"use client";
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import Badge from 'react-bootstrap/Badge';
import {getStockBasicInfo, getStockPrices} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';

export function StockCompInfo({stock_number}) {

    return (
        <Container fluid id="compinfo-container" className="w-100 h-100">
            <h1>CompInfo</h1>
        </Container>
    )
}


export function StockTradingInfo({stock_number}) {
    return (
        <Container fluid id="stocktradinginfo-container" className="w-100 h-100">
            <h1>StockTradingInfo</h1>
        </Container>
    )
}

export function StockBalSheet({stock_number}) {
    return (
        <Container fluid id="stockbalsheet-container" className="w-100 h-100">
            <h1>StockBalSheet</h1>
        </Container>
    )
}

export function StockIncStatement() {
    return (
        <Container fluid id="stockincstatement-container" className="w-100 h-100">
            <h1>StockIncStatement</h1>
        </Container>
    )
}

export function StockChart({stock_number}) {
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

export function StockBasicInfo( {stock_number}) {
    const [basicInfo, setBasicInfo] = useState(null);
    const [lastPriceData, setLastPriceData] = useState(null);
    const [diffValue, setDiffValue] = useState(null);

    useEffect(() => {
        async function getStockInfo() {
            const nowBasicInfo = await getStockBasicInfo(stock_number);
            const pricesData = await getStockPrices(stock_number);

            setBasicInfo(nowBasicInfo);
            setLastPriceData(pricesData[pricesData.length - 1]);

            // transfer the diff from string to float
            setDiffValue(pricesData[pricesData.length - 1].diff);
        }
        getStockInfo();
    }, [stock_number]);

    const DownArrow = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-down-square-fill" viewBox="0 0 16 16">
            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4 4a.5.5 0 0 0-.374.832l4 4.5a.5.5 0 0 0 .748 0l4-4.5A.5.5 0 0 0 12 6z"/>
            </svg>
        )
    }

    const UpArrow = () => {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-caret-up-square-fill" viewBox="0 0 16 16">
            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm4 9h8a.5.5 0 0 0 .374-.832l-4-4.5a.5.5 0 0 0-.748 0l-4 4.5A.5.5 0 0 0 4 11"/>
            </svg>
        )
    }

    return (
        <Container className="">
            <div className="d-flex flex-row justify-content-between align-items-center">
                <div className="fs-3 fw-bold me-3">
                    {basicInfo?.short_name} 
                    {" "}
                    {basicInfo?.stock_number} 
                </div>
                <h6 className="py-0 my-0">
                    <Badge pill bg="secondary">{basicInfo?.industry}</Badge>
                </h6>
                <Button variant="success" size="sm" className="ms-auto fw-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bookmark-plus me-2" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                <path d="M8 4a.5.5 0 0 1 .5.5V6H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V7H6a.5.5 0 0 1 0-1h1.5V4.5A.5.5 0 0 1 8 4"/>
                </svg>
                    加入投資組合
                </Button>{' '}
            </div>
            <div className="d-flex flex-row justify-content-between align-items-center">
                <div className={`fs-1 fw-bold ${diffValue > 0 ? 'text-danger' : 'text-success'}`}>
                    {lastPriceData?.close}
                </div>
                <div className={`fs-5 fw-bold ${diffValue > 0 ? 'text-danger' : 'text-success'}`}>
                    {lastPriceData && (diffValue > 0 ? <UpArrow /> : <DownArrow />)}&nbsp;    
                    {lastPriceData && (diffValue > 0 ? diffValue.toFixed(2) : (-diffValue).toFixed(2))}
                    {lastPriceData && ` (${(diffValue / lastPriceData.open * 100).toFixed(2)}%)`}
                </div>
                <div className="fs-5 fw-bold text-secondary">{lastPriceData && lastPriceData.date.toLocaleDateString()}</div>

            </div>
        </Container>
    ); 
}