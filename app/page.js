
import Container from 'react-bootstrap/Container';
import Button from "react-bootstrap/Button";

function HomeImage(props) {
  
  return (
    <Container className="mw-100 mh-100 px-0 mx-0 position-relative z-0" style={{height: "90vh"}} id="image-container">
      <img src="/homepage.jpg" alt="Home"></img>
      <div className="position-absolute top-0 start-0 w-100 h-100">
        <div className="position-absolute" style={{top: "35%", left: "25%"}}>
          <h1 className="text-white fw-bold mb-2 ms-4" style={{fontSize: "500%"}}>StockVista</h1>
          <h4 className="text-white ms-4" style={{fontSize: "150%"}}>A stock market analysis tool</h4>
        </div>
        <div className="position-absolute" style={{top: "35%", left: "25%"}}>
           <img src="/title-frame.png" alt="title" width="600" height="275" className="me-5"></img>
           <Button variant="light" className="position-absolute"  style={{bottom: "25%", left: "40%"}}>Learn More</Button>
        </div>
      </div>
    </Container>
  );
}

export default function Home() {
  return (
    <HomeImage />
  );
}
