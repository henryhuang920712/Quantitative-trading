"use client";
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import Badge from 'react-bootstrap/Badge';
import {getStockBasicInfo, getStockPrices, getStockBalSheet} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import Table from 'react-bootstrap/Table';

export function StockCompInfo({stock_number}) {
    const [compInfo, setCompInfo] = useState(null);
    useEffect(
        () => {
            async function getCompInfo() {
                const nowCompInfo = await getStockBasicInfo(stock_number);
                setCompInfo(nowCompInfo);
            }
            getCompInfo();
        }, [stock_number]
    )
    return (
        <Container fluid id="compinfo-container" className="w-100 h-100 pt-5">
            <Table hover responsive="sm">
                <tbody className="text-center">
                    <tr>
                    <td colSpan={1} >公司全名</td>
                    <td colSpan={3} >{compInfo?.fullName}</td>
                    </tr>
                    <tr>
                    <td>公司名稱</td>
                    <td>{compInfo?.short_name}</td>
                    <td>上市日</td>
                    <td>{compInfo?.list_date}</td>
                    </tr>
                    <tr>
                    <td>股票代號</td>
                    <td>{compInfo?.stock_number}</td>
                    <td>產業別</td>
                    <td>{compInfo?.industry}</td>
                    </tr>
                    <tr>
                    <td>董事長</td>
                    <td>{compInfo?.chairman}</td>
                    <td>發言人</td>
                    <td>{compInfo?.spokesman}</td>
                    </tr>
                    <tr>
                    <td>公司成立日期</td>
                    <td>{compInfo?.foundation_date}</td>
                    <td>發言人電話</td>
                    <td>{compInfo?.phone_num}</td>
                    </tr>
                </tbody>
        </Table>
        </Container>
    )
}


export function StockTradingInfo({stock_number}) {
    const [tradingInfo, setTradingInfo] = useState(null);
    const parentElement = useRef(null);
    const hasMounted = useRef(false);
    useEffect(() => {
        async function getTradingInfo() {
            const nowTradingInfo = await getStockBasicInfo(stock_number);
            setTradingInfo(nowTradingInfo);
        }
        getTradingInfo();
        hasMounted.current = true;
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && tradingInfo && hasMounted.current) {
            const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
            const chart = createChart(parentElement.current, chartOptions);
            const histogramSeries = chart.addHistogramSeries({ color: '#26a69a' });

            const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922, color: 'red' }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722, color: 'red' }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922, color: 'red' }];

            histogramSeries.setData(data);

            chart.timeScale().fitContent();

            hasMounted.current = false;
        }
    })

    return (
        <Container fluid id="stocktradinginfo-container" className="w-100 h-100">
            <div id="tradinginfo-chart-container" ref={parentElement} className="w-100 h-25 mb-5 mt-2">
            </div>
        </Container>
    )
}

export function StockBalSheet({stock_number}) {
    const [balSheet, setBalSheet] = useState(null);
    const [legendValue, setLegendValue] = useState(null);
    const orderRef = {
        asset: ["流動資產", "非流動資產", "資產總計"],
        liability: ["流動負債", "非流動負債", "負債總計"],
        equity: ["股本", "資本公積", "保留盈餘", "其他權益", "庫藏股票", "歸屬於母公司業主之權益合計", "非控制權益", "權益總計"],
    }
    const parentElement = useRef(null);
    const hasMounted = useRef(false);

    const ArrangeBalSheet = (balSheet) => {
        let balSheetContent = {};
        for (let nowCat in orderRef) {
            for (let nowItem of orderRef[nowCat]) {
                balSheetContent[nowItem] = [nowItem];
                for (let nowData in balSheet) {
                    balSheetContent[nowItem].push(nowData[nowItem]);
                }
            }
        }
        return balSheetContent;
    }

    const FitDataToChart = (balSheet, stringToFind) => {
        const nowData = balSheet.map(data => {
            let timestamp = parseInt(new Date(data.date_ad).getTime() / 1000);
            let number = parseInt(data[stringToFind].replace(/,/g, ""));
            return {time: timestamp, value: number};
        })
        
        nowData.reverse();
        return nowData;
    }

    const Square = ({color}) => {
        let colorStr = `var(${color})`;
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className={`bi bi-square mb-1 mx-2`} viewBox="0 0 16 16"  style={{ fill: colorStr, color: colorStr, backgroundColor: colorStr }}>
            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
            </svg>
        )
    }

    useEffect(() => {
        async function getBalSheet() {
            const nowBalSheet = await getStockBalSheet(stock_number);
            setBalSheet(nowBalSheet);
        }
        getBalSheet();
        hasMounted.current = true;
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && balSheet && hasMounted.current) {
            const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } }, autoSize: true};
            const chart = createChart(parentElement.current, chartOptions);

            chart.applyOptions(
                {
                    rightPriceScale: {
                        scaleMargins: {
                            top: 0.3, // leave some space for the legend
                            bottom: 0.25,
                        },
                    },
                    crosshair: {
                        // hide the horizontal crosshair line
                        horzLine: {
                            visible: false,
                            labelVisible: false,
                        },
                    },
                }
            )

            const assetLine = chart.addLineSeries({ color: '#121416' });
            const assetData = FitDataToChart(balSheet, "資產總計");
            assetLine.setData(assetData);

            const liabilityLine = chart.addLineSeries({ color: '#DC3545' });
            const liabilityData = FitDataToChart(balSheet, "負債總計");
            liabilityLine.setData(liabilityData);

            const equityLine = chart.addLineSeries({ color: '#198722' });
            const equityData = FitDataToChart(balSheet, "權益總計");
            equityLine.setData(equityData);
    
            chart.subscribeCrosshairMove(param => {
                let order = [assetLine, liabilityLine, equityLine];
                let nowLegendValue = [];
                order.map((line, index) => {
                    let priceFormatted = '';
                    if (param.time) {
                        const data = param.seriesData.get(line);
                        const price = data.value !== undefined ? data.value : data.close;
                        priceFormatted = price.toLocaleString();
                        // priceFormatted.replace(/\.0+$/, '');
                    }
                    nowLegendValue.push(priceFormatted);
                });
                setLegendValue(nowLegendValue);
            });

            chart.timeScale().fitContent();
            hasMounted.current = false;
        }
    }, [balSheet])

    return (
        <Container fluid id="stockbalsheet-container" className="w-100 h-100">
            <div id="balsheet-chart-container" ref={parentElement} className="w-100 h-25 mb-5 mt-2">
                <div id="balsheet-chart-legend" className="d-flex align-items-center flex-row">
                    <div className="me-2">
                        {legendValue && <Square color="--bs-dark" />}
                        {legendValue && `資產總計: ${legendValue[0]}`}
                    </div>
                    <div className="me-2">
                        {legendValue && <Square color="--bs-danger" />}
                        {legendValue && `負債總計: ${legendValue[1]}`}
                    </div>
                    <div className="me-2">
                        {legendValue && <Square color="--bs-success" />}
                        {legendValue && `權益總計: ${legendValue[2]}`}
                    </div>
                </div>
            </div>
            <Table hover responsive="sm" id="balsheet-table">
                <thead className="text-center">
                    <tr>
                        <th>年/季度</th>
                        {
                            balSheet && balSheet.map((data, index) => {
                                // split yy-ss-mm-dd then get yy and ss
                                const year = data.date.split("-")[0];
                                const season = data.date.split("-")[1];
                                return <th key={index}>{`${year} Q${season}`}</th>
                            })
                        }
                    </tr>
                </thead>
                <tbody className="text-center">
                    {
                        balSheet && Object.keys(ArrangeBalSheet(balSheet)).map((item, index) => {
                            return (
                                <tr key={index}>
                                    <td>{item}</td>
                                    {
                                        balSheet.map((data, index) => {
                                            return <td key={index}>{data[item]}</td>
                                        })
                                    }
                                </tr>
                            )
                        })
                    }
                </tbody>
            </Table>
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