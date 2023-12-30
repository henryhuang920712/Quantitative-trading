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
        <Container>
            <div className="row">
                <div className="col-3">{stockData?.["名稱"]}</div>
                <div className="col-3">{stockData?.["_id"]}</div>
                <div className="col-3">{stockData?.["產業別"]}</div>
            </div>
        </Container>
    ); 
}