"use client";
import {useEffect, useState} from 'react';
import GetStockInfo from '@/lib/getStockInfo';
import Container from 'react-bootstrap/Container';

export default function StockBasicInfo( {stock_number}) {
    const [stockData, setStockData] = useState(null);
    useEffect(() => {
        async function getStockInfo() {
            const data = await GetStockInfo(stock_number);
            setStockData(data);
        }
        getStockInfo();
    }, [stock_number]);

    return (
        <Container className="d-flex flex-row justify-content-between">
            <div className="">
                <div className="row">
                    <div className="col-3 fs-3 fw-bold">{stockData?.["名稱"]} {stockData?.["_id"]}</div>
                    <div className="col-3"></div>
                    <div className="col-3">{stockData?.["產業別"]}</div>
                </div>
                <div className="row">
                    <div className="col-3">{stockData?.["成交股數"]}</div>
                    <div className="col-3">{stockData?.["成交筆數"]}</div>
                    <div className="col-3">{stockData?.["成交金額"]}</div>
                </div>
            </div>
            <div className="">

            </div>
        </Container>
    ); 
}