import Container from 'react-bootstrap/Container';
import StockBasicInfo from '@/components/stockBasicInfo';


export default function StockInfoPage({params: {stock_number}}) {

    return (
        <Container>
            <StockBasicInfo stock_number={stock_number}/>
        </Container>
    )
}