"use client";
import {useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";
import Badge from 'react-bootstrap/Badge';
import {GetStockInfo, GetQuotesFugle} from '@/lib/getStockInfo';
import {formatDate} from '@/lib/formatData';

export default function StockBasicInfo( {stock_number}) {
    const [basicInfo, setBasicInfo] = useState(null);
    const [quotesData, setQuotesData] = useState(null);

    useEffect(() => {
        async function getStockBasicInfo() {
            const nowBasicInfo = await GetStockInfo(stock_number, "basic_info");
            const nowQuotesData = await GetQuotesFugle(stock_number);

            setBasicInfo(nowBasicInfo[0]);
            setQuotesData(nowQuotesData);

        }
        getStockBasicInfo();

    }, [stock_number]);

    const diffValue = quotesData?.changePercent;

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
                    {quotesData?.lastPrice}
                </div>
                <div className={`fs-5 fw-bold ${diffValue > 0 ? 'text-danger' : 'text-success'}`}>
                    {quotesData && (diffValue > 0 ? <UpArrow /> : <DownArrow />)}&nbsp;    
                    {quotesData && (diffValue)}
                    {quotesData && ` (${(diffValue / quotesData.openPrice * 100).toFixed(2)}%)`}
                </div>
                <div className="fs-5 fw-bold text-secondary">{quotesData && quotesData.date}</div>

            </div>
        </Container>
    ); 
}