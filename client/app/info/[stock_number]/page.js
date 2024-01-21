"use client";
import Container from 'react-bootstrap/Container';

import {StockBasicInfo, StockCompInfo, StockBalSheet, StockIncStatement, StockTradingInfo, StockChart} from '@/components/stock_number/stockBasicInfo';
import MyPortfolio from '@/components/sidebar';
import Nav from 'react-bootstrap/Nav';
import { useEffect, useState } from 'react';

export default function StockInfoPage({params: {stock_number}}) {
    const [nowSelectedTab, setNowSelectedTab] = useState('a');

    const handleSelect = (selectedKey) => {
        setNowSelectedTab(selectedKey);
    }

    function NavTabs() {
        return (
            <Nav fill variant="underline" onSelect={handleSelect} className="fw-bold" >
            <Nav.Item>
                <Nav.Link eventKey="a" active={nowSelectedTab === 'a'} className={`${nowSelectedTab !== 'a' ? 'text-success' : ''}`}>基本資訊</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="b" active={nowSelectedTab === 'b'} className={`${nowSelectedTab !== 'b' ? 'text-success' : ''}`}>技術分析</Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="c" active={nowSelectedTab === 'c'} className={`${nowSelectedTab !== 'c' ? 'text-success' : ''}`}>
                    資產負債表
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="d" active={nowSelectedTab === 'd'} className={`${nowSelectedTab !== 'd' ? 'text-success' : ''}`}>
                    損益表
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="e" active={nowSelectedTab === 'e'} className={`${nowSelectedTab !== 'e' ? 'text-success' : ''}`}>
                    法人動向
                </Nav.Link>
            </Nav.Item>
            </Nav>
        );
    }

    return (
        <Container fluid className="py-5 w-100 h-100 mx-0">
            <div className="row w-100 h-100 ">
                <main className="col-md-9 ml-sm-auto col-lg-9 px-md-4 px-lg-5 d-flex flex-column">
                    <StockBasicInfo stock_number={stock_number} />
                    <NavTabs />
                    <Container className="tab-content pt-2 flex-grow-1" id="nav-tabContent">
                        {nowSelectedTab === 'a' && <StockCompInfo stock_number={stock_number} />}
                        {nowSelectedTab === 'b' && <StockChart stock_number={stock_number} />}
                        {nowSelectedTab === 'c' && <StockBalSheet stock_number={stock_number} />}
                        {nowSelectedTab === 'd' && <StockIncStatement stock_number={stock_number} />}
                        {nowSelectedTab === 'e' && <StockTradingInfo stock_number={stock_number} />}
                    </Container>
                </main>
                <MyPortfolio />
            </div>
        </Container>
    )
}