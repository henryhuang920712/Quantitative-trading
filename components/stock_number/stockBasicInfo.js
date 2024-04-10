"use client";
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import Badge from 'react-bootstrap/Badge';
import {GetStockInfo} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import Table from 'react-bootstrap/Table';
import { GroupedBarsSeries } from '@/components/multipleBarCharts/grouped-bars-series';
import { CrosshairHighlightPrimitive } from '@/components/multipleBarCharts/highlight-bar-crosshair';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import Placeholder from 'react-bootstrap/Placeholder';


function formatDate(originalDate) { 
    // like "2021-03-22T00:00:00.000Z"
    const date = new Date(originalDate);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function formatNumString(number) {
    if (number < 0) {
        return `(${(-number).toLocaleString()})`;
    } else {
        if (number === null) {
            return "0";
        }
        return number.toLocaleString();
    }
}

export function StockCompInfo({stock_number}) {
    const [compInfo, setCompInfo] = useState(null);
    useEffect(
        () => {
            async function getCompInfo() {
                const nowCompInfo = await GetStockInfo(stock_number, "basic_info");
                setCompInfo(nowCompInfo[0]);
            }
            getCompInfo();
        }, [stock_number]
    )
    return (
        <Container fluid id="compinfo-container" className="w-100 h-100 pt-5">
            {   compInfo === null ? 
                <Placeholder xs={12} as={Table} animation="wave" />
                : 
                <Table hover responsive="sm">
                <tbody className="text-center">
                    <tr>
                    <td colSpan={1} >公司全名</td>
                    <td colSpan={3} >{compInfo?.CompanyName}</td>
                    </tr>
                    <tr>
                    <td>公司名稱</td>
                    <td>{compInfo?.shortName}</td>
                    <td>上市日</td>
                    <td>{compInfo?.ListingDate}</td>
                    </tr>
                    <tr>
                    <td>股票代號</td>
                    <td>{compInfo?.symbol}</td>
                    <td>產業別</td>
                    <td>{compInfo?.IndustryType}</td>
                    </tr>
                    <tr>
                    <td>董事長</td>
                    <td>{compInfo?.Chairman}</td>
                    <td>發言人</td>
                    <td>{compInfo?.Spokesperson}</td>
                    </tr>
                    <tr>
                    <td>公司成立日期</td>
                    <td>{compInfo?.EstablishmentDate}</td>
                    <td>發言人電話</td>
                    <td>{compInfo?.IRContactPhone}</td>
                    </tr>
                </tbody>
            </Table>
            }
        </Container>
    )
}


export function StockTradingInfo({stock_number}) {
    const [tradingInfo, setTradingInfo] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [checkbox, setCheckbox] = useState([0, 1, 2, 3]);
    const parentElement = useRef(null);

    const barColors = ['#2962FF', '#E1575A', '#F28E2C', 'rgb(164, 89, 209)'];

    const handleChange = (val, e) => {
        val.sort((a, b) => a - b);

        // const nowVal = parseInt(e.target.value);
        setCheckbox(val);
 
        const nowChartData = tradingInfo?.map((data) => {
            const nowValues = [data.foreign, data.investment, data.dealer, data.total];
            let values = [];
            val.forEach((index) => {
                values.push(nowValues[index]);
            });
            return {
                time: parseInt(new Date(data.date).getTime() / 1000),
                values: values,
            };
        })
        setChartData(nowChartData);

    }

    useEffect(() => {
        async function getTradingInfo() {
            const allTradingInfo = await GetStockInfo(stock_number, "trading_info");
            const nowTradingInfo = allTradingInfo.map(data => {
                let date = data.date;
                let foreign = data["外陸資買賣超股數(不含外資自營商)"] + data["外資自營商買賣超股數"];
                let investment = data["投信買賣超股數"];
                let dealer = data["自營商買賣超股數(自行買賣)"] + data["自營商買賣超股數(避險)"];
                let total = data["三大法人買賣超股數"];
                return {date, foreign, investment, dealer, total};
            });

            nowTradingInfo.sort((a, b) => new Date(a.date) - new Date(b.date));
            setTradingInfo(nowTradingInfo);

            const nowChartData = nowTradingInfo.map((data) => {
                const nowValues = [data.foreign, data.investment, data.dealer, data.total];
                let values = [];
                checkbox.forEach((index) => {
                    values.push(nowValues[index]);
                });
                return {
                    time: parseInt(new Date(data.date).getTime() / 1000),
                    values: values,
                };
            })
            setChartData(nowChartData);
            
        }
        getTradingInfo();
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && tradingInfo) {

            // if it exists, clear the chart
            if (document.getElementById("multiple-bar-chart-content")) {
                document.getElementById("multiple-bar-chart-content").innerHTML = "";
            }
            const chart = createChart('multiple-bar-chart-content', {
                autoSize: true,
                timeScale: {
                    barSpacing: 40,
                    minBarSpacing: 20,
                },
            });
        
            const customSeriesView = new GroupedBarsSeries();
            const myCustomSeries = chart.addCustomSeries(customSeriesView, {
                /* Options */
                colors: checkbox.map((index) => barColors[index]),
            });

            // const chartData = multipleBarData(3, 200, 20);
            myCustomSeries.setData(chartData);
            myCustomSeries.attachPrimitive(
                new CrosshairHighlightPrimitive({ color: 'rgba(0, 100, 200, 0.2)' })
            );
        }
    }, [tradingInfo, chartData])

    return (
        <Container fluid id="stocktradinginfo-container" className="w-100 h-100">
            <div id="multiple-bar-chart" className="w-100 h-25 mb-5 mt-2">
                <ToggleButtonGroup type="checkbox" onChange={handleChange} value={checkbox} id="tradinginfo-chart-legend" className="d-flex align-items-center flex-row mb-2 w-50">
                    {["外資", "投信", "自營商", "合計"].map((items, index) => {
                        return (
                        <ToggleButton id={`tbg-btn-${index}`} key={index} value={index} className="me-2 rounded-pill" size="sm" style={{backgroundColor: checkbox.includes(index) ? barColors[index] : "white", color:  checkbox.includes(index) ? "white" : "black", borderColor: barColors[index]}} variant="light">
                            {items}
                        </ToggleButton>
                        );
                    })}
                </ToggleButtonGroup>
                <div id="multiple-bar-chart-content" ref={parentElement} className="mh-100 h-100">
                    {chartData === null && <Placeholder xs={12} as={Table} animation="wave" />}
                </div>
            </div>
            <div className="h-75 mh-75 overflow-y-auto">
                <Table hover id="tradinginfo-table" className="h-100 w-100">
                    <thead className="text-center text-bold">
                        <tr>
                            <th>日期</th>
                            <th>外資</th>
                            <th>投信</th>
                            <th>自營商</th>
                            <th>合計</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {
                            tradingInfo && tradingInfo.slice(-100).reverse().map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{formatDate(data.date)}</td>
                                        <td>{formatNumString(data.foreign)}</td>
                                        <td>{formatNumString(data.investment)}</td>
                                        <td>{formatNumString(data.dealer)}</td>
                                        <td>{formatNumString(data.total)}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </Table>
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
            let timestamp = parseInt(new Date(data.date).getTime() / 1000);
            let number = data[stringToFind];

            return {time: timestamp, value: number};
        })

        nowData.sort((a, b) => a.time - b.time);

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
            const nowBalSheet = await GetStockInfo(stock_number, "bal_sheet");

            // sort the data by date
            nowBalSheet.sort((a, b) => new Date(a.date) - new Date(b.date));
            nowBalSheet.reverse();
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
                                const year = parseInt(data.date.split("-")[0]);
                                const month = parseInt(data.date.split("-")[1]);
                                const season = Math.ceil(month / 3);
                                return <th key={index}>{`${year} Q${season}`}</th>
                            })
                        }
                    </tr>
                </thead>
                <tbody className="text-center">
                    {
                        balSheet && Object.keys(ArrangeBalSheet(balSheet)).map((item, index) => {
                            return (
                                <tr key={index} className={item.includes("總計") ? "table-active" : ""}>
                                    <td>{item}</td>
                                    {
                                        balSheet.map((data, index) => {
                                            return <td key={index}>{formatNumString(data[item])}</td>
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

export function StockIncStatement({stock_number}) {
    const [incStatement, setIncStatement] = useState(null);
    const [legendValue, setLegendValue] = useState(null);
    const orderRef = {
        asset: ["流動資產", "非流動資產", "資產總計"],
        liability: ["流動負債", "非流動負債", "負債總計"],
        equity: ["股本", "資本公積", "保留盈餘", "其他權益", "庫藏股票", "歸屬於母公司業主之權益合計", "非控制權益", "權益總計"],
    }
    const parentElement = useRef(null);
    const hasMounted = useRef(false);

    const ArrangeIncStatement = (inc) => {
        let incContent = {};
        for (let nowCat in orderRef) {
            for (let nowItem of orderRef[nowCat]) {
                incContent[nowItem] = [nowItem];
                for (let nowData in inc) {
                    incContent[nowItem].push(nowData[nowItem]);
                }
            }
        }
        return incContent;
    }

    const FitDataToChart = (inc, stringToFind) => {
        const nowData = inc.map(data => {
            let timestamp = parseInt(new Date(data.date).getTime() / 1000);
            let number = data[stringToFind];

            return {time: timestamp, value: number};
        })

        nowData.sort((a, b) => a.time - b.time);

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
        async function getIncStatement() {
            const nowInc = await GetStockInfo(stock_number, "bal_sheet");

            // sort the data by date
            nowInc.sort((a, b) => new Date(a.date) - new Date(b.date));
            nowInc.reverse();
            setIncStatement(nowInc);
        }
        getIncStatement();
        hasMounted.current = true;
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && incStatement&& hasMounted.current) {
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
            const assetData = FitDataToChart(incStatement, "資產總計");
            assetLine.setData(assetData);

            const liabilityLine = chart.addLineSeries({ color: '#DC3545' });
            const liabilityData = FitDataToChart(incStatement, "負債總計");
            liabilityLine.setData(liabilityData);

            const equityLine = chart.addLineSeries({ color: '#198722' });
            const equityData = FitDataToChart(incStatement, "權益總計");
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
    }, [incStatement])

    return (
        <Container fluid id="stockincStatement-container" className="w-100 h-100">
            <div id="incStatement-chart-container" ref={parentElement} className="w-100 h-25 mb-5 mt-2">
                <div id="incStatement-chart-legend" className="d-flex align-items-center flex-row">
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
            <Table hover responsive="sm" id="incStatement-table">
                <thead className="text-center">
                    <tr>
                        <th>年/季度</th>
                        {
                            incStatement && incStatement.map((data, index) => {
                                // split yy-ss-mm-dd then get yy and ss
                                const year = parseInt(data.date.split("-")[0]);
                                const month = parseInt(data.date.split("-")[1]);
                                const season = Math.ceil(month / 3);
                                return <th key={index}>{`${year} Q${season}`}</th>
                            })
                        }
                    </tr>
                </thead>
                <tbody className="text-center">
                    {
                        incStatement && Object.keys(ArrangeIncStatement(incStatement)).map((item, index) => {
                            return (
                                <tr key={index} className={item.includes("總計") ? "table-active" : ""}>
                                    <td>{item}</td>
                                    {
                                        incStatement.map((data, index) => {
                                            return <td key={index}>{formatNumString(data[item])}</td>
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

export function StockChart({stock_number}) {
    const [pricesData, setPricesData] = useState(null);
    const parentElement = useRef(null);
    const hasMounted = useRef(false);

    useEffect(() => {
        async function getStockPricesData() {
            const nowPricesData = await GetStockInfo(stock_number, "prices");
            nowPricesData.sort((a, b) => new Date(a.date) - new Date(b.date));
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
                return { time: formatDate(price.date), open: price.open, high: price.high, low: price.low, close: price.close };
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
        async function getStockBasicInfo() {
            const nowBasicInfo = await GetStockInfo(stock_number, "basic_info");
            const pricesData = await GetStockInfo(stock_number, "prices");
            pricesData.sort((a, b) => new Date(a.date) - new Date(b.date));

            setBasicInfo(nowBasicInfo[0]);
            setLastPriceData(pricesData[pricesData.length - 1]);

            // transfer the diff from string to float
            setDiffValue(pricesData[pricesData.length - 1].close - pricesData[pricesData.length - 1].open);
        }
        getStockBasicInfo();

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
                    {basicInfo?.shortName}
                    {" "}
                    {basicInfo?.symbol} 
                </div>
                <h6 className="py-0 my-0">
                    <Badge pill bg="secondary">{basicInfo?.IndustryType}</Badge>
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
                <div className="fs-5 fw-bold text-secondary">{lastPriceData && formatDate(lastPriceData.date)}</div>

            </div>
        </Container>
    ); 
}