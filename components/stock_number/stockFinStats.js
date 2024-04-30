'use client';
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import {GetStockInfo} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import Table from 'react-bootstrap/Table';
import {formatDate, formatNumString} from '@/lib/formatData';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';

// get finFormat.json
import finFormat from './finFormat.json';



export default function StockFinStats({stock_number}) {
    const [activeKey, setActiveKey] = useState("a");
    return (
        <Container fluid id="finstats-container" className="w-100 h-100 pt-0">
            <Container fluid className="stocknum-info-nav w-100 py-2">
                <Nav variant="pills" defaultActiveKey="a" onSelect={(selectedKey)=>setActiveKey(selectedKey)}>
                <Nav.Item className="me-2" >
                    <Nav.Link eventKey="a">每月營收</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-2">
                    <Nav.Link eventKey="b" size="sm">資產負債表</Nav.Link>
                </Nav.Item>
                <Nav.Item className="me-2">
                    <Nav.Link eventKey="c" size="sm">損益表</Nav.Link>
                </Nav.Item>
                </Nav>
            </Container>
            <Container fluid id="finstats-content" className="w-100 h-100">
                {activeKey === "a" && <StockRevenue stock_number={stock_number} />}
                {activeKey === "b" && <StockBalSheet stock_number={stock_number} />}
                {activeKey === "c" && <StockIncStatement stock_number={stock_number} />}
            </Container>
        </Container>
    )
}

function StockRevenue({stock_number}) {
    const [sales, setSales] = useState(null);
    const [legendValue, setLegendValue] = useState(null);
    const parentElement = useRef(null);
    const hasMounted = useRef(false);
    const orderRef = {
        monthlyRev: ["當月營收", "上月比較增減(%)", "去年當月營收", "去年同月增減(%)"],
        accRev: ["當月累計營收", "去年累計營收", "前期比較增減(%)"],
    }
    const ArrangeSales = (sales) => {
        let salesContent = {};
        
        for (let nowCat in orderRef) {
            for (let nowItem of orderRef[nowCat]) {
                // balsheet conditions
                let myItem = nowItem;
                if (sales[0][nowItem] === null) {
                    // if (nowItem.includes("總計")) {
                    //     myItem = myItem.replace("總計", "總額");
                    // }
                }

                salesContent[nowItem] = [nowItem];
                for (let nowData of sales) {
                    if (nowData[myItem] === null) {
                        salesContent[nowItem].push(0);
                    } else {
                        salesContent[nowItem].push(nowData[myItem]);
                    }
                }
            }
        }
        return salesContent;
    }

    const FitDataToChart = (sales, stringToFind) => {
        const nowData = sales.map(data => {
            let timestamp = parseInt(new Date(data.date).getTime() / 1000);
            let number = data[stringToFind];
            if (number === null) {
                number = 0;
            }

            return {time: timestamp, value: number};
        })

        nowData.sort((a, b) => a.time - b.time);

        return nowData;
    }
    useEffect(() => {
        async function getSales() {
            const nowSales = await GetStockInfo(stock_number, "sales");

            // sort the data by date
            nowSales.sort((a, b) => new Date(a.date) - new Date(b.date));
            nowSales.reverse();
            setSales(nowSales);
        }
        getSales();
        hasMounted.current = true;
    }, [stock_number]);
    useEffect(() => {
        if (parentElement.current && sales && hasMounted.current) {
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

            const salesLine = chart.addLineSeries({ color: '#121416' });
            const salesData = FitDataToChart(sales, "當月營收");
            salesLine.setData(salesData);
    
            chart.subscribeCrosshairMove(param => {
                let order = [salesLine];
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
    }, [sales])
    return (
        <Container fluid id="stockrevenue-container" className="w-100 h-100">
            <div id="stockrevenue-chart-container" ref={parentElement} className="w-100 h-25 mb-5 mt-2">
                <div id="stockrevenue-chart-legend" className="d-flex align-items-center flex-row">
                    <div className="me-2">
                        {legendValue && <Square color="--bs-dark" />}
                        {legendValue && `當月營收: ${legendValue[0]}`}
                    </div>
                    {/* <div className="me-2">
                        {legendValue && <Square color="--bs-danger" />}
                        {legendValue && `負債總計: ${legendValue[1]}`}
                    </div>
                    <div className="me-2">
                        {legendValue && <Square color="--bs-success" />}
                        {legendValue && `權益總計: ${legendValue[2]}`}
                    </div> */}
                </div>
            </div>
            <Table hover responsive="sm" id="stockrevenue-table">
                <thead className="text-center">
                    <tr>
                        <th>年/季度</th>
                        {
                            sales && sales.map((data, index) => {
                                // split yy-ss-mm-dd then get yy and ss
                                const year = parseInt(data.date.split("-")[0]);
                                const month = parseInt(data.date.split("-")[1]);
                                return <th key={index}>{`${year}-${month}`}</th>
                            })
                        }
                    </tr>
                </thead>
                <tbody className="text-center">
                    {
                        (sales && (() => {
                            let newSales = ArrangeSales(sales);
                            return (Object.keys(newSales)).map((item, index) => {
                                return (
                                    <tr key={index} className={item.includes("總計") ? "table-active" : ""}>
                                        {
                                            (newSales[item]).map((data, index) => {
                                                return <td key={index}>{formatNumString(data)}</td>
                                            })
                                        }
                                    </tr>
                                )
                            })
                        })())
                    }
                </tbody>
            </Table>
        </Container>
    )
}


function StockBalSheet({stock_number}) {
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
                // balsheet conditions
                let myItem = nowItem;
                if (balSheet[0][nowItem] === null) {
                    if (nowItem.includes("總計")) {
                        myItem = myItem.replace("總計", "總額");
                    }
                }

                balSheetContent[nowItem] = [nowItem];
                for (let nowData of balSheet) {
                    if (nowData[myItem] === null) {
                        balSheetContent[nowItem].push(0);
                    } else {
                        balSheetContent[nowItem].push(nowData[myItem]);
                    }
                }
            }
        }
        // console.log(balSheetContent);
        return balSheetContent;
    }

    const FitDataToChart = (balSheet, stringToFind) => {
        const nowData = balSheet.map(data => {
            let timestamp = parseInt(new Date(data.date).getTime() / 1000);
            let number = data[stringToFind];
            if (number === null) {
                if (stringToFind.includes("總計")) {
                    number = data[stringToFind.replace("總計", "總額")]
                } else {
                    number = 0;
                }
            }

            return {time: timestamp, value: number};
        })

        nowData.sort((a, b) => a.time - b.time);

        return nowData;
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
                        (balSheet && (() => {
                            let newBalSheet = ArrangeBalSheet(balSheet);
                            return (Object.keys(newBalSheet)).map((item, index) => {
                                return (
                                    <tr key={index} className={item.includes("總計") ? "table-active" : ""}>
                                        {
                                            (newBalSheet[item]).map((data, index) => {
                                                return <td key={index}>{formatNumString(data)}</td>
                                            })
                                        }
                                    </tr>
                                )
                            })
                        })())
                    }
                </tbody>
            </Table>
        </Container>
    )
}

function StockIncStatement({stock_number}) {
    const [incStatement, setIncStatement] = useState(null);
    const [legendValue, setLegendValue] = useState(null);
    const [seasonMode, setSeasonMode] = useState("單季");
    const orderRef = finFormat.find(obj => obj.mode === "inc_statement" && obj.symbols.includes(stock_number)).format;

    const parentElement = useRef(null);
    const textBold = ["營業收入", "營業利益(損失)", "本期淨利(淨損)", "本期綜合損益總額", "基本每股盈餘(元)"]

    const FitDataToChart = (inc, stringToFind) => {
        let newData = [];
        for (let i = inc.date.length - 1; i >= 0; i--) {
            let timestamp = parseInt(new Date(inc.date[i]).getTime() / 1000);
            let number = inc[stringToFind][i];
            if (number === null) {
                number = 0;
            }
            newData.push({time: timestamp, value: number});
        }
        return newData;
    }
    const DeductSeason = (inc) => {
        let newInc = {...inc};
        for (let i = 0; i < newInc.date.length - 1; i++) {
            const month = parseInt(newInc.date[i].split("-")[1]);
            const season = Math.ceil(month / 3);
            if (season > 1) {
                for (let nowKey in newInc) {
                    if (nowKey === "date") {
                        continue;
                    }
                    newInc[nowKey][i] -= newInc[nowKey][i + 1];
                }
            }
        }
        return newInc;
    }

    const AddSeason = (inc) => {
        let newInc = {...inc};
        for (let i = newInc.date.length - 2; i >= 0; i--) {
            const month = parseInt(newInc.date[i].split("-")[1]);
            const season = Math.ceil(month / 3);
            if (season > 1) {
                for (let nowKey in newInc) {
                    if (nowKey === "date") {
                        continue;
                    }
                    newInc[nowKey][i] += newInc[nowKey][i + 1];
                }
            }
        }
        return newInc;
    }

    const handleSeasonMode = (eventKey) => {
        
        if (incStatement === null) {
            return;
        }
        let newInc = {...incStatement};
        if (eventKey === "單季" && seasonMode === "累季") {
            newInc = DeductSeason(newInc);
        } else if (eventKey === "累季" && seasonMode === "單季") {
            newInc = AddSeason(newInc);
        }
        setIncStatement(newInc);
        setSeasonMode(eventKey);
    }

    useEffect(() => {
        async function getIncStatement() {
            let nowInc = await GetStockInfo(stock_number, "inc_statement");
            console.log(nowInc);
            // sort the data by date
            nowInc.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const initLen = nowInc.length;
            for (let i = initLen - 1; i >= 0; i--) {
                const month = parseInt(nowInc[i].date.split("-")[1]);
                const season = Math.ceil(month / 3);
                if (season > 1) {
                    // drop the data if it's not the first season
                    nowInc.pop();
                } else {
                    break;
                }
            }
            let newInc = ChangeFormat(nowInc, orderRef);
            newInc = DeductSeason(newInc);

            setIncStatement(newInc);
        }
        getIncStatement();
    }, [stock_number]);

    useEffect(() => {
        if (parentElement.current && incStatement) {
            // if it exists, clear the chart
            if (document.getElementById("incStatement-chart-container")) {
                document.getElementById("incStatement-chart-container").innerHTML = "";
            }

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

            const revLine = chart.addLineSeries({ color: '#121416' });
            const revData = FitDataToChart(incStatement, "營業收入");
            revLine.setData(revData);

            const pmLine = chart.addLineSeries({ color: '#DC3545' });
            const pmData = FitDataToChart(incStatement, "營業利益(損失)");
            pmLine.setData(pmData);

            const niLine = chart.addLineSeries({ color: '#198722' });
            const niData = FitDataToChart(incStatement, "本期淨利(淨損)");
            niLine.setData(niData);
    
            chart.subscribeCrosshairMove(param => {
                let order = [revLine, pmLine, niLine];
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
        }
    }, [incStatement])

    return (
        <Container fluid id="stockincStatement-container" className="w-100 h-100">
            <div className="w-100 h-25 mb-5 mt-2 row">
                <div id="incStatement-chart-legend" className="d-flex align-items-center flex-row col-10">
                    <div className="me-2">
                        {legendValue && <Square color="--bs-dark" />}
                        {legendValue && `營業收入: ${legendValue[0]}`}
                    </div>
                    <div className="me-2">
                        {legendValue && <Square color="--bs-danger" />}
                        {legendValue && `營業利益(損失): ${legendValue[1]}`}
                    </div>
                    <div className="">
                        {legendValue && <Square color="--bs-success" />}
                        {legendValue && `本期淨利(淨損): ${legendValue[2]}`}
                    </div>
                </div>
                <div className="col-2 mb-2 d-flex justify-content-center">
                <Dropdown defaultChecked={seasonMode} onSelect={handleSeasonMode}>
                <Dropdown.Toggle variant="success" size="sm" >{seasonMode}</Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey="單季">單季</Dropdown.Item>
                    <Dropdown.Item eventKey="累季">累季</Dropdown.Item>
                </Dropdown.Menu>
                </Dropdown>
                </div>
                <div id="incStatement-chart-container" ref={parentElement} className="h-100 w-100">
                </div>
            </div>
            <Table hover responsive="sm" id="incStatement-table">
                <thead className="text-center">
                    <tr>
                        <th>年/季度</th>
                        {
                            incStatement && incStatement.date.map((data, index) => {
                                // split yy-ss-mm-dd then get yy and ss
                                const year = parseInt(data.split("-")[0]);
                                const month = parseInt(data.split("-")[1]);
                                const season = Math.ceil(month / 3);
                                return <th key={index}>{`${year} Q${season}`}</th>
                            })
                        }
                    </tr>
                </thead>
                <tbody className="text-center">
                    {
                        (incStatement && (() => {
                            return (Object.keys(incStatement)).map((item, index) => {
                                if (item === "date") {
                                    return;
                                }
                                return (
                                    <tr key={index} className={textBold.includes(item) ? "table-active" : ""}>
                                        <td>{item}</td>
                                        {
                                            (incStatement[item]).map((data, index) => {
                                                return <td key={index}>{formatNumString(data)}</td>
                                            })
                                        }
                                    </tr>
                                )
                            })
                        })())

                        
                    }
                </tbody>
            </Table>
        </Container>
    )
}

const Square = ({color}) => {
    let colorStr = `var(${color})`;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className={`bi bi-square mb-1 mx-2`} viewBox="0 0 16 16"  style={{ fill: colorStr, color: colorStr, backgroundColor: colorStr }}>
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
        </svg>
    )
}

function ChangeFormat(data, orderRef) {
    let dataContent = {};
    for (let nowItem of orderRef) {
        dataContent[nowItem.name] = [];
        for (let nowData of data) {
            let nowVal;
            nowVal = 0;
            for (let add of nowItem.add) {
                if (add in nowData && nowData[add] !== null) {
                    nowVal += nowData[add];
                } else if (add !== nowItem.name && orderRef.some(obj => obj.name === add)) {
                    nowVal += dataContent[add][dataContent[nowItem.name].length];
                }
            }
            for (let sub of nowItem.sub) {
                if (sub in nowData && nowData[sub] !== null) {
                    nowVal -= nowData[sub];
                } else if (orderRef.some(obj => obj.name === sub)) {
                    nowVal -= dataContent[sub][dataContent[nowItem.name].length];
                }
            }
            dataContent[nowItem.name].push(nowVal);
        }
    }
    dataContent["date"] = data.map(data => data.date);
    return dataContent;
}