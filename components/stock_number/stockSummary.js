'use client';
import {useEffect, useState, useRef} from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Nav from 'react-bootstrap/Nav';
import {GetStockInfo, GetStockInfoFugle, GetQuotesFugle, GetTradesFugle} from '@/lib/getStockInfo';
import {createChart} from 'lightweight-charts';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import {formatNumString} from '@/lib/formatData';
import Placeholder from 'react-bootstrap/Placeholder';

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
            <Container fluid id="summary-content" className="w-100 h-100 pt-2">
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

    const bidRatio = (quotesData?.total?.tradeVolumeAtBid / quotesData?.total?.tradeVolume * 100).toFixed(2);

    const BidPricesTable = () => {
        if (!quotesData || !quotesData.bids || !quotesData.asks) {
            return <Placeholder as={Card} animation="glow"></Placeholder>
        }
        let BidPrices = [], AskPrices = [], totalBidSize = 0, totalAskSize = 0;
        // get the max size of the bids and asks
        let maxBidSize = Math.max(...quotesData?.bids?.map(bid => bid.size));
        let maxAskSize = Math.max(...quotesData?.asks?.map(ask => ask.size));
        let maxTradeSize = Math.max(maxBidSize, maxAskSize);
        for (let i = 0; i < 5; i ++) {
            const nowBidRatio = (quotesData.bids[i].size / maxTradeSize * 100).toFixed(2);
            const nowAskRatio = (quotesData.asks[i].size / maxTradeSize * 100).toFixed(2);
            BidPrices.push(
                <Row key={`bid-row-${i}`}>
                <Col md={2}>{quotesData?.bids?.[i].size}</Col>
                <Col md={6} className="pt-1"><ProgressBar variant="info" now={nowBidRatio} className="justify-content-end"/></Col>
                <Col md={4}  className="" >{quotesData?.bids?.[i].price}</Col>
                </Row>
            )
            AskPrices.push(
                <Row key={`ask-row-${i}`}>
                <Col md={4} className="">{quotesData?.asks?.[i].price}</Col>
                <Col md={6} className="pt-1"><ProgressBar variant="info" now={nowAskRatio} className="justify-content-start"/></Col>
                <Col md={2}>{quotesData?.asks?.[i].size}</Col>
                </Row>
            )
            totalBidSize += quotesData.bids[i].size;
            totalAskSize += quotesData.asks[i].size;
        }
        return (
            <Container className="w-100 pb-5 fw-medium text-center">
                <Row className="row-cols-1 row-cols-lg-1 row-cols-xl-2 g-2">
                <Col>
                <Card className="w-100 fw-semibold mb-1 d-inline-block m-2 text-center bg-transparent">
                    <Card.Header>
                        <Row>
                        <Col md={2}>量</Col>
                        <Col md={6} className="pt-1"></Col>
                        <Col md={4}>委買價</Col>
                        </Row>
                    </Card.Header>
                    <Card.Body>
                        {BidPrices}
                    </Card.Body>
                    <Card.Footer>
                    <Row>
                    <Col md={4}>{totalBidSize}</Col>
                    <Col md={6}></Col>
                    <Col md={2}>總計</Col>
                    </Row>
                    </Card.Footer>    
                </Card>
                </Col>
                <Col>
                <Card className="w-100 fw-semibold mb-1 d-inline-block m-2 text-center bg-transparent">
                    <Card.Header>
                        <Row>
                    <Col md={4}>委賣價</Col>
                    <Col md={6}></Col>
                    <Col md={2}>量</Col>
                    </Row>
                    </Card.Header>
                    <Card.Body>
                        {AskPrices}
                    </Card.Body>
                    <Card.Footer>
                    <Row>
                    <Col md={4}>總計</Col>
                    <Col md={6}></Col>
                    <Col md={2}>{totalAskSize}</Col>
                    </Row>
                    </Card.Footer>                       
                </Card>
                </Col>
                </Row>
            </Container>
        )
    }

    useEffect(() => {
        async function getSummaryData() {
            const nowSummaryData = await GetStockInfoFugle(stock_number, "1");
            nowSummaryData.sort((a, b) => new Date(a.date) - new Date(b.date));
            const lastday = new Date(nowSummaryData[nowSummaryData.length - 1].date).setHours(0, 0, 0, 0);
            const lastdayData = nowSummaryData.filter(price => new Date(price.date).setHours(0, 0, 0, 0) === lastday);
        
            setSummaryData(lastdayData);
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
            const areaSeries = chart.addBaselineSeries({ baseValue: { type: 'price', price: summaryData[0].open }, bottomLineColor: 'rgba( 38, 166, 154, 1)', bottomFillColor1: 'rgba( 38, 166, 154, 0.28)', bottomFillColor2: 'rgba( 38, 166, 154, 0.05)', topLineColor: 'rgba( 239, 83, 80, 1)', topFillColor1: 'rgba( 239, 83, 80, 0.05)', topFillColor2: 'rgba( 239, 83, 80, 0.28)' });
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
        <Container fluid id="stock-trend-container" ref={parentElement} className="mw-100 w-100 h-50 stock-charts">
        </Container>
        <Container fluid id="stock-trend-progress" className="w-100 pb-2">
            <div className="d-flex flex-row justify-content-between">
                <div className="fs-6 fw-bold">內盤</div>
                <div className="fs-6 fw-bold">外盤</div>
            </div>
            {
                bidRatio === "NaN" ? <Placeholder as={ProgressBar} animation="glow"></Placeholder> : 
                <ProgressBar>
                <ProgressBar now={bidRatio} label={`${bidRatio}%`} variant="success" key={1} />
                <ProgressBar now={100 - bidRatio} label={`${100 - bidRatio}%`} variant="danger" key={2} />
                </ProgressBar>
            }
        </Container>
        <BidPricesTable />
        </>
    )
}

function StockTradeDetail({stock_number}) {
    const [tradeDetail, setTradeDetail] = useState(null);
    const parentElement = useRef(null);

    useEffect(() => {
        async function getTradeDetail() {
            const nowTradeDetail = await GetTradesFugle(stock_number);
            nowTradeDetail.data?.sort((a, b) => new Date(a.time) - new Date(b.time));
            setTradeDetail(nowTradeDetail);
        }
        getTradeDetail();
    }, [stock_number]);

    return (
        <Container fluid id="stocktradedetail-container" className="w-100 h-75 mh-75 overflow-y-auto">
            <div className="h-100">
                <Table hover id="tradinginfo-table" className="h-100 w-100">
                    <thead className="text-center text-bold">
                        <tr>
                            <th>時間</th>
                            <th>價格</th>
                            <th>數量</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {
                            tradeDetail && tradeDetail.data?.map((nowdata, index) => {
                                const nowTime = new Date(nowdata.time / 1000);
                                return (
                                    <tr key={index}>
                                        <td>{nowTime.toLocaleTimeString()}</td>
                                        <td>{formatNumString(nowdata.price)}</td>
                                        <td>{formatNumString(nowdata.size)}</td>
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