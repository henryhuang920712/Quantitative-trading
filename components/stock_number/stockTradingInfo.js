'use client';
import {useEffect, useState,  useRef } from 'react';
import Container from 'react-bootstrap/Container';
import { GroupedBarsSeries } from '@/components/multipleBarCharts/grouped-bars-series';
import { CrosshairHighlightPrimitive } from '@/components/multipleBarCharts/highlight-bar-crosshair';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import Placeholder from 'react-bootstrap/Placeholder';
import Table from 'react-bootstrap/Table';
import {GetStockInfo} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import {formatDate, formatNumString} from '@/lib/formatData';


export default function StockTradingInfo({stock_number}) {
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
                                        <td className={(data.total >= 0 ? "text-danger" : "text-success") + " fw-medium"}>{formatNumString(data.total)}</td>
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
