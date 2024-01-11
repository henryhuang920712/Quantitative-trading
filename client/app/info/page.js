import Container from 'react-bootstrap/Container';
import { MainIndexChart } from '@/components/info/mainChart';

function StockChart(props) {
    return (
        <Container className="h-100">
            <h1>Stock Chart</h1>
            <MainIndexChart />
        </Container>
    )
}

export default function Info() {
    return (
        <StockChart />
    )
}