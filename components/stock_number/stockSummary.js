'use client';
import {useEffect, useState, useRef} from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Nav from 'react-bootstrap/Nav';
import {GetStockInfo, GetStockInfoFugle, GetQuotesFugle} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import ProgressBar from 'react-bootstrap/ProgressBar';
import {Bar} from 'react-chartjs-2';
import {Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend} from 'chart.js';
import { quotes } from '@fugle/marketdata/lib/rest/stock/snapshot/quotes';

export default function StockSummary({stock_number}) {
    const [activeKey, setActiveKey] = useState("a");

    return (
        <Container fluid id="summary-container" className="w-100 h-100">
            <Container fluid className="stocknum-info-nav w-100 py-2">
                <Nav variant="pills" defaultActiveKey="a" onSelect={(selectedKey)=>setActiveKey(selectedKey)}>
                <Nav.Item className="me-2" >
                    <Nav.Link eventKey="a">五檔</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-2">
                    <Nav.Link eventKey="b" size="sm">成交明細</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-2">
                    <Nav.Link eventKey="c" size="sm">分價量表</Nav.Link>
                </Nav.Item>
                </Nav>
            </Container>
            <Container fluid id="summary-content" className="w-100 h-100">
                {activeKey === "a" && <StockTrend stock_number={stock_number} activeKey />}
                {activeKey === "b" && <StockTradeDetail stock_number={stock_number} activeKey />}
                {activeKey === "c" && <StockPriceVolume stock_number={stock_number} activeKey />}
            </Container>
        </Container>
    )
}

function StockTrend({stock_number, activeKey="a"}) {
    const [summaryData, setSummaryData] = useState(null);
    const [quotesData, setQuotesData] = useState(null);
    const parentElement = useRef(null);

    const BidsBarChart = () => {
        const data = {

        }

        const options = {
            "indexAxis": "y",
            "layout": {
                "padding": 10
            }
        }
        ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
        return (
            <Container fluid id="stock-trend-bids" className="w-100 h-50">
                <Bar data={data} options={options} />
            </Container>
        )
    }

    useEffect(() => {
        async function getSummaryData() {
            const nowSummaryData = await GetStockInfoFugle(stock_number, "1");
            
            const today = new Date().setHours(0, 0, 0, 0);
            const todayData = nowSummaryData.filter(price => new Date(price.date).setHours(0, 0, 0, 0) === today);
            
            todayData.sort((a, b) => new Date(a.date) - new Date(b.date));
            setSummaryData(todayData);
        }

        async function getQuotesData() {
            const nowQuotesData = await GetQuotesFugle(stock_number);
            setQuotesData(nowQuotesData);
        }
        getSummaryData();
        getQuotesData();
    }, [stock_number, activeKey]);

    useEffect(() => {
        if (parentElement.current && summaryData) {
            // if it exists, clear the chart
            if (document.getElementById("stock-trend-container")) {
                document.getElementById("stock-trend-container").innerHTML = "";
            }

            const chart = createChart(parentElement.current, { autoSize: true});
            chart.timeScale().applyOptions({
                timeVisible: true,
                secondsVisible: false,
            });
            // size change listener
            let data = summaryData.map(price => {
                const nowTime = new Date(price.date);
                // change date to string + 1911
                return { time: Math.floor(nowTime.getTime() / 1000 - (nowTime.getTimezoneOffset() * 60)), value: price.close};
            });

            const areaSeries = chart.addBaselineSeries({ baseValue: { type: 'price', price: summaryData[0].open }, topLineColor: 'rgba( 38, 166, 154, 1)', topFillColor1: 'rgba( 38, 166, 154, 0.28)', topFillColor2: 'rgba( 38, 166, 154, 0.05)', bottomLineColor: 'rgba( 239, 83, 80, 1)', bottomFillColor1: 'rgba( 239, 83, 80, 0.05)', bottomFillColor2: 'rgba( 239, 83, 80, 0.28)' });
            try {
                areaSeries.setData(data);

                // fit the chart
                chart.timeScale().fitContent();
            } catch (error) {
            console.log(data);
            console.log(error);
            }
    
        }
    }, [summaryData, activeKey]);    

    return (<>
        <Container fluid id="stock-trend-container" ref={parentElement} className="w-100 h-75">
        </Container>
        <Container fluid id="stock-trend-progress" className="w-100 h-50">
            <div className="d-flex flex-row justify-content-between">
                <div className="fs-6 fw-bold">內盤</div>
                <div className="fs-6 fw-bold">外盤</div>
            </div>
            <ProgressBar>
                {
                    () => {
                        console.log(quotesData?.total.tradeVolumeAtBid, quotesData?.total.tradeVolume);
                        const bidRatio = (quotesData?.total.tradeVolumeAtBid / quotesData.total.tradeVolume * 100).toFixed(2);
                        const askRatio = 100 - bidRatio;
                        return (
                            <>
                            <ProgressBar now={bidRatio} label={`${bidRatio}%`} variant="success" key={1} />
                            <ProgressBar now={askRatio} label={`${askRatio}%`} variant="danger" key={2} />
                            </>
                        )
                    }
                }

            </ProgressBar>
        </Container>
        </>
    )
}

function StockTradeDetail({stock_number}) {
    const [tradeDetail, setTradeDetail] = useState(null);
    const parentElement = useRef(null);

    useEffect(() => {
        async function getTradeDetail() {
            const nowTradeDetail = await GetStockInfo(stock_number, "trade_detail");
            setTradeDetail(nowTradeDetail);
        }
        getTradeDetail();
    }, [stock_number]);
}

function StockPriceVolume({stock_number}) {
    const [priceVolume, setPriceVolume] = useState(null);
    const parentElement = useRef(null);

    useEffect(() => {
        async function getPriceVolume() {
            const nowPriceVolume = await GetStockInfo(stock_number, "price_volume");
            setPriceVolume(nowPriceVolume);
        }
        getPriceVolume();
    }, [stock_number]);
}