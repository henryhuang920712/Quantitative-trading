"use client";
import {useEffect, useState} from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import Placeholder from 'react-bootstrap/Placeholder';
import {GetStockInfo} from '@/lib/getStockInfo';

export default function StockCompInfo({stock_number}) {
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